import { IAbcFile } from "xswf/dist/abcFile/types";
import {
  Instruction,
  InstructionCode,
  IPushstringInstr
} from "xswf/dist/abcFile/types/bytecode";
import { MultinameKind } from "xswf/dist/abcFile/types/multiname";

export interface IVersion {
  major: number;
  minor: number;
  release: number;
  revision: number;
  patch: number;
}

export function extractVersion(abcFile: IAbcFile): IVersion {
  const buildInfos = abcFile.instances.find(
    c =>
      c.name.kind === MultinameKind.QName &&
      c.name.ns.name.startsWith("com.ankamagames.dofus") &&
      c.name.name.includes("BuildInfos")
  );

  const extractValue = (i: Instruction) => {
    if (i.code === InstructionCode.pushbyte) {
      return i.byteValue;
    } else if (i.code === InstructionCode.pushint) {
      return abcFile.constantPool.integers[i.operand0];
    }
    return 0;
  };

  const extractFromString = (x: string) => {
    return +x;
  };

  let major = 0;
  let minor = 0;
  let release = 0;
  let revision = 0;
  let patch = 0;

  const extractVersionString = (
    majMinRelInstr: IPushstringInstr,
    revInstr: Instruction,
    patchInstr: Instruction
  ) => {
    // string of format "MAJOR.MINOR.RELEASE"
    const majMinRel = majMinRelInstr.value.split(".");
    major = extractFromString(majMinRel[0]);
    minor = extractFromString(majMinRel[1]);
    release = extractFromString(majMinRel[2]);
    revision = extractValue(revInstr);
    patch = extractValue(patchInstr);
  };

  const instrs = buildInfos!.class.cinitBody.code;

  if (instrs[2].code === InstructionCode.debug) {
    const majMinRelInstr = instrs[5] as IPushstringInstr;
    const revInstr = instrs[8];
    const patchInstr = instrs[9];
    extractVersionString(majMinRelInstr, revInstr, patchInstr);
  } else if (instrs[4].code === InstructionCode.pushstring) {
    const majMinRelInstr = instrs[4] as IPushstringInstr;
    const revInstr = instrs[7];
    const patchInstr = instrs[8];
    extractVersionString(majMinRelInstr, revInstr, patchInstr);
  } else {
    const majInstr = instrs[4];
    const minInstr = instrs[5];
    const relInstr = instrs[6];
    const revInstr = instrs[14];
    const patchInstr = instrs[17];

    major = extractValue(majInstr);
    minor = extractValue(minInstr);
    release = extractValue(relInstr);
    revision = extractValue(revInstr);
    patch = extractValue(patchInstr);
  }

  return { major, minor, release, revision, patch };
}
