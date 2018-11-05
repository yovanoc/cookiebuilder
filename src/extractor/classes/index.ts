import { IAbcFile } from "xswf/dist/abcFile/types";
import { InstructionCode } from "xswf/dist/abcFile/types/bytecode";
import { IClassInfo } from "xswf/dist/abcFile/types/classes";
import {
  Constant,
  ConstantKind,
  INumberConstant
} from "xswf/dist/abcFile/types/constant";
import { IMethodInfo } from "xswf/dist/abcFile/types/methods";
import { IQName, MultinameKind } from "xswf/dist/abcFile/types/multiname";
import { ITraitMethod, TraitKind } from "xswf/dist/abcFile/types/trait";
import { reduceMethod, reduceType } from "./reducers";
import { findMethodWithPrefix } from "./utils";

export interface ID2ClassField {
  name: string;
  type: string;
  writeMethod: string;
  method: string;
  isVector: boolean;
  isDynamicLength: boolean;
  length: number;
  WriteLengthMethod: string;
  useTypeManager: boolean;
  useBBW: boolean;
  bbwPosition: number;
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
      `erialize method not found in class ${klass.instance.name.name}`
    );
  }
  const m = (trait as ITraitMethod).method;

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
  return [];
}

function extractSerializeMethods(
  c: IClassInfo,
  m: IMethodInfo,
  fields: Map<string, ID2ClassField>
) {
  //
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
