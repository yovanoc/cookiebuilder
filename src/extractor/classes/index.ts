import { IAbcFile } from "xswf/dist/abcFile/types";
import { Instruction, InstructionCode } from "xswf/dist/abcFile/types/bytecode";
import { IClassInfo } from "xswf/dist/abcFile/types/classes";
import {
  Constant,
  ConstantKind,
  INumberConstant
} from "xswf/dist/abcFile/types/constant";
import { IMethodBody } from "xswf/dist/abcFile/types/methods";
import {
  IQName,
  ITypeName,
  MultinameKind
} from "xswf/dist/abcFile/types/multiname";
import {
  ITraitMethod,
  ITraitSlot,
  TraitKind
} from "xswf/dist/abcFile/types/trait";
import {
  handleBBWProp,
  handleGetProperty,
  handleSimpleProp,
  handleTypeManagerProp,
  handleVecPropDynamicLen,
  handleVecPropLength,
  handleVecScalarProp,
  handleVecTypeManagerProp,
  preprocessBytecode
} from "./handlers";
import { reduceMethod, reduceType } from "./reducers";
import { findMethodWithPrefix, isPublicNamespace } from "./utils";

export interface ID2ClassField {
  name: string;
  type: string;
  writeMethod?: string;
  method?: string;
  isVector: boolean;
  isDynamicLength?: boolean;
  length?: number;
  writeLengthMethod?: string;
  useTypeManager?: boolean;
  useBBW?: boolean;
  bbwPosition?: number;
}

export interface ID2Class {
  package: string;
  name: string;
  parent: string;
  fields: ID2ClassField[];
  protocolId: number;
  useHashFunc: boolean;
}

export interface ID2MessagesAndTypes {
  messages: ID2Class[];
  types: ID2Class[];
}

export function extractD2MessagesAndTypes(
  abcFile: IAbcFile
): ID2MessagesAndTypes {
  const messages: ID2Class[] = [];
  const types: ID2Class[] = [];

  const messagePrefix = "com.ankamagames.dofus.network.messages.";
  const typePrefix = "com.ankamagames.dofus.network.types.";

  for (const klass of abcFile.classes) {
    if (!klass.instance.protectedNs) {
      continue;
    }
    const isMessage = klass.instance.protectedNs.name.startsWith(messagePrefix);
    const isType = klass.instance.protectedNs.name.startsWith(typePrefix);
    if (isMessage || isType) {
      const k = extractD2Class(klass);
      if (isMessage) {
        messages.push(k);
      } else if (isType) {
        types.push(k);
      }
    }
  }

  return {
    messages,
    types
  };
}

export function extractD2Class(klass: IClassInfo): ID2Class {
  const trait = findMethodWithPrefix(klass, "serializeAs_");
  if (!trait) {
    throw new Error(
      `Serialize method not found in class ${klass.instance.name.name}`
    );
  }
  const m = (trait as ITraitMethod).methodBody;

  const fields = extractMessageFields(klass);

  const fieldsMap: Map<string, ID2ClassField> = new Map();
  for (const f of fields) {
    fieldsMap.set(f.name, f);
  }

  extractSerializeMethods(klass, m, fieldsMap);

  for (const field of fields) {
    reduceType(field);
    reduceMethod(field);
  }

  const protocolId = extractProtocolID(klass);

  const useHashFunc = xuseHashFunc(klass);

  let superName = (klass.instance.supername as IQName).name;
  if (superName === "Object" || superName === "NetworkMessage") {
    superName = "";
  }

  return {
    package: klass.instance.protectedNs ? klass.instance.protectedNs.name : "",
    name: klass.instance.name.name,
    parent: superName,
    fields,
    protocolId,
    useHashFunc
  };
}

function extractMessageFields(c: IClassInfo): ID2ClassField[] {
  const createField = (name: string, tt: IQName | ITypeName): ID2ClassField => {
    let isVector = false;
    const t = tt.name;
    let type = typeof t === "string" ? t : "";
    if (tt.kind === MultinameKind.TypeName) {
      type = (tt.names[0] as IQName).name;
      isVector = true;
    } else if (t === "ByteArray") {
      isVector = true;
      type = "uint";
    }

    return {
      name,
      type,
      isVector
    };
  };
  const fields: ID2ClassField[] = [];
  const slots = c.instance.traits.filter(
    t => t.kind === TraitKind.Slot || t.kind === TraitKind.Const
  );
  for (const slot of slots) {
    const name = slot.name;
    if (!isPublicNamespace(name.ns)) {
      continue;
    }
    const field = createField(name.name, (slot as ITraitSlot).typeName as
      | IQName
      | ITypeName);
    fields.push(field);
  }
  // NetworkDataContainerMessage uses a pair of setter/getter to store content
  // It seems to be useless and the only packet that does so we need to
  // also check for pairs of getter/setter
  interface IGetSetter {
    getter: boolean;
    getterType?: IQName;
    setter: boolean;
  }
  const getSetters: Map<string, IGetSetter> = new Map();
  const methods = c.instance.traits.filter(
    t =>
      t.kind === TraitKind.Method ||
      t.kind === TraitKind.Getter ||
      t.kind === TraitKind.Setter
  );
  for (const m of methods) {
    const isGetter = m.kind === TraitKind.Getter;
    const isSetter = m.kind === TraitKind.Setter;
    const name = m.name;
    if (!(isGetter || isSetter) || !isPublicNamespace(name.ns)) {
      continue;
    }
    let v = getSetters.get(m.name.name);
    if (!v) {
      v = {
        getter: false,
        setter: false
      };
      getSetters.set(m.name.name, v);
    }
    v.getter = v.getter || isGetter;
    v.setter = v.setter || isSetter;
    if (isGetter) {
      v.getterType = (m as ITraitMethod).method.returnType as IQName;
    }
  }

  for (const [name, gs] of getSetters) {
    if (!(gs.getter && gs.setter)) {
      continue;
    }
    const field = createField(name, gs.getterType!);
    fields.push(field);
  }
  return fields;
}

function extractSerializeMethods(
  c: IClassInfo,
  m: IMethodBody,
  fields: Map<string, ID2ClassField>
) {
  const checkPattern = (
    instructions: Instruction[],
    pattern: InstructionCode[]
  ): boolean => {
    if (pattern.length > instructions.length) {
      return false;
    }
    for (let x = 0; x < pattern.length; x++) {
      if (instructions[x].code !== pattern[x]) {
        return false;
      }
    }
    return true;
  };

  interface IPattern {
    pattern: InstructionCode[];
    handler: (
      c: IClassInfo,
      fields: Map<string, ID2ClassField>,
      instrs: Instruction[],
      field?: ID2ClassField
    ) => ID2ClassField | undefined;
  }

  const patterns: IPattern[] = [
    {
      handler: handleVecPropDynamicLen,
      pattern: [
        InstructionCode.getlocal,
        InstructionCode.increment | InstructionCode.increment_i,
        InstructionCode.convert_b |
          InstructionCode.convert_d |
          InstructionCode.convert_i |
          InstructionCode.convert_o |
          InstructionCode.convert_s |
          InstructionCode.convert_u,
        InstructionCode.setlocal,
        InstructionCode.getlocal,
        InstructionCode.pushbyte,
        InstructionCode.iflt
      ]
    },
    {
      handler: handleVecTypeManagerProp,
      pattern: [
        InstructionCode.getproperty,
        InstructionCode.getlocal,
        InstructionCode.getproperty,
        InstructionCode.getlex,
        InstructionCode.astypelate,
        InstructionCode.callproperty
      ]
    },
    {
      handler: handleBBWProp,
      pattern: [
        InstructionCode.getlex,
        InstructionCode.getlocal,
        InstructionCode.pushbyte,
        InstructionCode.getlocal,
        InstructionCode.getproperty,
        InstructionCode.callproperty
      ]
    },
    {
      handler: handleVecScalarProp,
      pattern: [
        InstructionCode.getproperty,
        InstructionCode.getlocal,
        InstructionCode.getproperty,
        InstructionCode.callpropvoid
      ]
    },
    {
      handler: handleVecPropLength,
      pattern: [
        InstructionCode.getproperty,
        InstructionCode.getproperty,
        InstructionCode.callpropvoid
      ]
    },
    {
      handler: handleSimpleProp,
      pattern: [InstructionCode.getproperty, InstructionCode.callpropvoid]
    },
    {
      handler: handleTypeManagerProp,
      pattern: [
        InstructionCode.getproperty,
        InstructionCode.callproperty,
        InstructionCode.callpropvoid
      ]
    },
    {
      handler: handleGetProperty,
      pattern: [InstructionCode.getproperty]
    }
  ];

  const instrs = preprocessBytecode(m.code);
  const instrsLen = instrs.length;

  let last: ID2ClassField | undefined;
  let i = 0;

  while (i < instrsLen) {
    let f: ID2ClassField | undefined;
    for (const p of patterns) {
      const slice = instrs.slice(i, i + p.pattern.length);
      if (checkPattern(slice, p.pattern)) {
        f = p.handler(c, fields, slice, last);
        i += p.pattern.length;
      }
    }
    if (!f) {
      i++;
    } else {
      last = f;
    }
  }
}

function extractProtocolID(c: IClassInfo): number {
  const slots = c.traits.filter(t => t.kind === TraitKind.Const);
  for (const t of slots) {
    if (t.name.name === "protocolId") {
      if (t.kind !== TraitKind.Const) {
        return 0;
      }
      if ((t.value as Constant).kind !== ConstantKind.Int) {
        return 0;
      }
      return (t.value as INumberConstant).val;
    }
  }
  return 0;
}

function xuseHashFunc(c: IClassInfo): boolean {
  const getPackFunc = (cl: IClassInfo): ITraitMethod | undefined => {
    for (const met of cl.instance.traits.filter(
      t =>
        t.kind === TraitKind.Method ||
        t.kind === TraitKind.Setter ||
        t.kind === TraitKind.Getter
    )) {
      if (met.name.name === "pack" && met.kind === TraitKind.Method) {
        return met;
      }
    }
    return;
  };

  const m = getPackFunc(c);

  if (!m) {
    return false;
  }

  for (const instr of m.methodBody.code) {
    if (instr.code === InstructionCode.getlex) {
      const multiname = instr.name;
      if (multiname.kind === MultinameKind.QName) {
        const name = (multiname as IQName).name;
        if (name === "HASH_FUNCTION") {
          return true;
        }
      }
    }
  }

  return false;
}
