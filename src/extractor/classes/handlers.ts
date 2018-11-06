import {
  ICallpropertyInstr,
  ICallpropvoidInstr,
  IGetlexInstr,
  IGetlocalInstr,
  IGetpropertyInstr,
  Instruction,
  InstructionCode,
  IPushbyteInstr,
  ISetlocalInstr
} from "xswf/dist/abcFile/types/bytecode";
import { IClassInfo } from "xswf/dist/abcFile/types/classes";
import {
  IMultinameL,
  IQName,
  MultinameKind
} from "xswf/dist/abcFile/types/multiname";
import { ID2ClassField } from ".";
import { isPublicQName } from "./utils";

export function preprocessBytecode(code: Instruction[]): Instruction[] {
  return code
    .filter(c => {
      return !(
        c.code === InstructionCode.debug ||
        c.code === InstructionCode.debugfile ||
        c.code === InstructionCode.debugline
      );
    })
    .map(c => {
      switch (c.code) {
        case InstructionCode.getlocal_0:
          return {
            code: InstructionCode.getlocal,
            index: 0,
            byteOffset: c.byteOffset
          } as IGetlocalInstr;
        case InstructionCode.getlocal_1:
          return {
            code: InstructionCode.getlocal,
            index: 1,
            byteOffset: c.byteOffset
          } as IGetlocalInstr;
        case InstructionCode.getlocal_2:
          return {
            code: InstructionCode.getlocal,
            index: 2,
            byteOffset: c.byteOffset
          } as IGetlocalInstr;
        case InstructionCode.getlocal_3:
          return {
            code: InstructionCode.getlocal,
            index: 3,
            byteOffset: c.byteOffset
          } as IGetlocalInstr;
        case InstructionCode.setlocal_0:
          return {
            code: InstructionCode.setlocal,
            index: 0,
            byteOffset: c.byteOffset
          } as ISetlocalInstr;
        case InstructionCode.setlocal_1:
          return {
            code: InstructionCode.setlocal,
            index: 1,
            byteOffset: c.byteOffset
          } as ISetlocalInstr;
        case InstructionCode.setlocal_2:
          return {
            code: InstructionCode.setlocal,
            index: 2,
            byteOffset: c.byteOffset
          } as ISetlocalInstr;
        case InstructionCode.setlocal_3:
          return {
            code: InstructionCode.setlocal,
            index: 3,
            byteOffset: c.byteOffset
          } as ISetlocalInstr;
        default:
          return c;
      }
    });
}

export function handleVecPropDynamicLen(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const push = instrs[5] as IPushbyteInstr;
  const len = push.byteValue;

  if (!last || last.isVector || last.isDynamicLength) {
    throw new Error("vector  found but no dynamic vector");
  }

  last.length = len;
  return last;
}

export function handleVecTypeManagerProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const lex = instrs[3] as IGetlexInstr;
  const call = instrs[5] as ICallpropertyInstr;

  const getMultiname = get.name as IQName;
  const lexMultiname = lex.name as IQName;
  const callMultiname = call.name as IQName;

  if (!isPublicQName(getMultiname)) {
    return undefined;
  }

  const lexNs = lexMultiname.ns;
  const lexNsName = lexNs.name;

  if (!lexNsName.startsWith("com.ankamagames.dofus.network.types")) {
    return undefined;
  }

  const callName = callMultiname.name;
  if (callName !== "getTypeId") {
    return undefined;
  }

  const prop = getMultiname.name;

  const field = fields.get(prop);

  if (!field || !field.isVector) {
    throw new Error(
      `${c.instance.protectedNs!.name}: ${prop} field is not a vector`
    );
  }

  field.useTypeManager = true;
  return field;
}

export function handleBBWProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const lex = instrs[0] as IGetlexInstr;
  const lexMultiname = lex.name;
  const lexName = (lexMultiname as IQName).name;
  if (lexName !== "BooleanByteWrapper") {
    return undefined;
  }
  const push = instrs[2] as IPushbyteInstr;
  const position = push.byteValue;
  const getProp = instrs[4] as IGetpropertyInstr;
  const propMultiname = getProp.name;
  const prop = (propMultiname as IQName).name;

  const field = fields.get(prop);
  if (!field || (field && field.type !== "Boolean")) {
    throw new Error(
      `${
        c.instance.protectedNs!.name
      }: ${prop} usage of BooleanByteWrapper on non boolean field`
    );
  }
  field.useBBW = true;
  field.bbwPosition = position;
  return field;
}

export function handleVecScalarProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const getIndex = instrs[2] as IGetpropertyInstr;

  const getMultiname = get.name as IQName;
  const getIndexMultiname = getIndex.name as IMultinameL;

  if (
    !isPublicQName(getMultiname) ||
    getIndexMultiname.kind !== MultinameKind.MultinameL
  ) {
    return undefined;
  }

  const call = instrs[3] as ICallpropvoidInstr;
  const callMultiname = call.name as IQName;

  if (callMultiname.kind !== MultinameKind.QName) {
    return undefined;
  }

  const writeMethod = callMultiname.name;

  if (!writeMethod.startsWith("write")) {
    throw new Error(
      `${
        c.instance.protectedNs!.name
      }: ${writeMethod} method for vector of scalar types`
    );
  }

  const prop = getMultiname.name;

  const field = fields.get(prop);

  if (!field || !field.isVector) {
    throw new Error(
      `${c.instance.protectedNs!.name}: vector of scalar write on ${prop} field`
    );
  }

  field.writeMethod = writeMethod;
  return field;
}

export function handleVecPropLength(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const getLen = instrs[1] as IGetpropertyInstr;
  const call = instrs[2] as ICallpropvoidInstr;

  const getMultiname = get.name as IQName;
  const getLenMultiname = getLen.name as IQName;
  const callMultiname = call.name as IQName;

  if (!isPublicQName(getMultiname) || !isPublicQName(getLenMultiname)) {
    return undefined;
  }

  if (getLenMultiname.name !== "") {
    return undefined;
  }

  const prop = getMultiname.name;

  const field = fields.get(prop);

  if (!field || !field.isVector) {
    throw new Error(
      `${c.instance.protectedNs!.name} write on non-vector ${prop}`
    );
  }

  const writeMethod = callMultiname.name;

  if (!writeMethod.startsWith("write")) {
    return undefined;
  }

  field.isDynamicLength = true; // TODO: Not sure?
  field.writeMethod = writeMethod;

  return field;
}

export function handleSimpleProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const call = instrs[1] as ICallpropvoidInstr;

  const getMultiname = get.name as IQName;
  const callMultiname = call.name as IQName;

  if (!isPublicQName(getMultiname)) {
    return undefined;
  }

  const prop = getMultiname.name;
  const writeMethod = callMultiname.name;

  if (!writeMethod.startsWith("write")) {
    return undefined;
  }

  const field = fields.get(prop);

  if (!field) {
    throw new Error(`${c.instance.protectedNs!.name}.${prop} field not found`);
  }
  field.writeMethod = writeMethod;
  return field;
}

export function handleTypeManagerProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const getType = instrs[1] as ICallpropertyInstr;
  const call = instrs[2] as ICallpropvoidInstr;

  const getMultiname = get.name as IQName;
  const getTypeMultiname = getType.name as IQName;
  const callMultiname = call.name as IQName;

  if (!isPublicQName(getMultiname) || !isPublicQName(getTypeMultiname)) {
    return undefined;
  }

  if (getTypeMultiname.name !== "getTypeId") {
    return undefined;
  }

  const prop = getMultiname.name;

  const field = fields.get(prop);

  if (!field) {
    throw new Error(
      `${c.instance.protectedNs!.name} getTypeId on ${prop} field`
    );
  }

  const writeMethod = callMultiname.name;

  if (writeMethod !== "writeShort") {
    throw new Error(
      `${c.instance.protectedNs!.name} invalid ${writeMethod} for getTypeId`
    );
  }

  field.useTypeManager = true;
  return field;
}
export function handleGetProperty(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  const get = instrs[0] as IGetpropertyInstr;
  const multi = get.name as IQName;

  if (!isPublicQName(multi)) {
    return undefined;
  }

  const name = multi.name;

  const field = fields.get(name);

  if (!field) {
    return undefined;
  }

  return field;
}
