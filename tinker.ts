import { SwfReader } from "xswf";
import {
  ICallpropertyInstr,
  ICallpropvoidInstr,
  IGetlexInstr,
  IGetlocal0Instr,
  IGetlocal1Instr,
  IGetlocalInstr,
  IGetpropertyInstr,
  Instruction,
  InstructionCode,
  IPushbyteInstr,
  IPushscopeInstr,
  ISetlocalInstr
} from "xswf/dist/abcFile/types/bytecode";
import { IQName } from "xswf/dist/abcFile/types/multiname";
import { ITagDoAbc, TagCode } from "xswf/dist/Types";

const reader = new SwfReader("./tests/DofusInvoker.swf");

const file = reader.getFile();

const doAbc = file.tags.find(tag => tag.code === TagCode.DoABC) as ITagDoAbc;

const abcFile = doAbc.abcFile;

const bodies = abcFile.methodBodies.filter(m =>
  m.method.name.includes("/serializeAs_GameServerInformations")
);

function instructionToString(instr: Instruction) {
  switch (instr.code) {
    case InstructionCode.getlocal:
      return `getlocal(${instr.index})`;
    case InstructionCode.setlocal:
      return `setlocal(${instr.index})`;
    case InstructionCode.getproperty:
      return `getproperty(${(instr.name as IQName).name})`;
    case InstructionCode.callpropvoid:
      return `callpropvoid(${(instr.name as IQName).name}, ${instr.argCount})`;
    case InstructionCode.findpropstrict:
      return `findpropstrict(${(instr.name as IQName).name})`;
    case InstructionCode.pushstring:
      return `pushstring("${instr.value}")`;
    case InstructionCode.pushbyte:
      return `pushbyte(${instr.byteValue})`;
    case InstructionCode.ifnlt:
      return `ifnlt(${instr.offset}) => ${instr.byteOffset + instr.offset + 4}`;
    case InstructionCode.jump:
      return `jump(${instr.operand0}) => ${instr.byteOffset +
        instr.operand0 +
        4}`;
    case InstructionCode.iflt:
      return `iflt(${instr.operand0}) => ${instr.byteOffset +
        instr.operand0 +
        4}`;
    case InstructionCode.iftrue:
      return `iftrue(${instr.operand0}) => ${instr.byteOffset +
        instr.operand0 +
        4}`;
    case InstructionCode.iffalse:
      return `iffalse(${instr.operand0}) => ${instr.byteOffset +
        instr.operand0 +
        4}`;
    case InstructionCode.getlex:
      return `getlex(${(instr.name as IQName).name})`;
    case InstructionCode.callproperty:
      return `callproperty(${(instr.name as IQName).name}, ${instr.argCount})`;
    case InstructionCode.pushdouble:
      return `pushdouble(${instr.value})`;
    case InstructionCode.contructprop:
      return `contructprop(${(instr.name as IQName).name}, ${instr.argCount})`;
    default:
      return InstructionCode[instr.code];
  }
}

function preprocessBytecode(code: Instruction[]): Instruction[] {
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

const patterns: Array<{
  label: string;
  pattern: InstructionCode[];
  handler?: (instrs: Instruction[]) => void;
}> = [
  {
    label: "function prelude",
    pattern: [InstructionCode.getlocal, InstructionCode.pushscope],
    handler: (instrs: [IGetlocal0Instr, IPushscopeInstr]) => {
      /**/
    }
  },
  {
    label: "simple prop",
    pattern: [InstructionCode.getproperty, InstructionCode.callpropvoid],
    handler: (instrs: [IGetpropertyInstr, ICallpropvoidInstr]) => {
      console.log((instrs[0].name as IQName).name);
    }
  },
  {
    label: "BBW",
    pattern: [
      InstructionCode.getlex,
      InstructionCode.getlocal,
      InstructionCode.pushbyte,
      InstructionCode.getlocal,
      InstructionCode.getproperty,
      InstructionCode.callproperty
    ],
    handler: (
      instrs: [
        IGetlexInstr,
        IGetlocal0Instr,
        IPushbyteInstr,
        IGetlocal1Instr,
        IGetpropertyInstr,
        ICallpropertyInstr
      ]
    ) => {
      console.log(instrs);
    }
  }
].sort((a, b) => b.pattern.length - a.pattern.length);

bodies.forEach(m => {
  const codes = preprocessBytecode(m.code);
  console.log("=======", m.method.name, "=======");
  console.log("");

  let i = 0;
  while (i < codes.length) {
    const matchedPattern = patterns
      .filter(entry => entry.pattern.length <= codes.length - i)
      .find(entry => {
        let match = true;
        for (let k = 0; k < entry.pattern.length; k++) {
          if (entry.pattern[k] !== codes[i + k].code) {
            match = false;
            break;
          }
        }
        return match;
      });

    if (matchedPattern) {
      const instrs = codes.slice(i, i + matchedPattern.pattern.length);

      console.log(`[${i}] ${matchedPattern.label}`);
      console.log("---------------------------");
      console.log(
        instrs.map(c => c.byteOffset + "\t" + instructionToString(c)).join("\n")
      );
      console.log("---------------------------");
      console.log("");

      if (matchedPattern.handler) {
        matchedPattern.handler(instrs);
        console.log("");
      }

      i += instrs.length;
    } else {
      i++;
    }
  }

  return;
});
