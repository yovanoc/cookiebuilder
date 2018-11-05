import {
  ICallpropertyInstr,
  IGetlexInstr,
  IGetlocal0Instr,
  IGetlocal1Instr,
  IGetlocalInstr,
  IGetpropertyInstr,
  Instruction,
  InstructionCode,
  IPushbyteInstr,
  ISetlocalInstr
} from "xswf/dist/abcFile/types/bytecode";
import { IClassInfo } from "xswf/dist/abcFile/types/classes";
import { IQName } from "xswf/dist/abcFile/types/multiname";
import { ID2ClassField } from ".";

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
  return undefined;
}

export function handleVecTypeManagerProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  return undefined;
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
    // throw new Error(
    //   `${
    //     c.instance.protectedNs!.name
    //   }: ${prop} usage of BooleanByteWrapper on non boolean field`
    // );
    return undefined;
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
  return undefined;
}

export function handleVecPropLength(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  return undefined;
}

export function handleSimpleProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  return undefined;
}

export function handleTypeManagerProp(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  return undefined;
}
export function handleGetProperty(
  c: IClassInfo,
  fields: Map<string, ID2ClassField>,
  instrs: Instruction[],
  last?: ID2ClassField
): ID2ClassField | undefined {
  return undefined;
}
