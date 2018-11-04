import { IAbcFile } from "xswf/dist/abcFile/types";
import { IFindpropstrictInstr } from "xswf/dist/abcFile/types/bytecode";
import { IQName, MultinameKind } from "xswf/dist/abcFile/types/multiname";

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

  const major = 0;
  const minor = 0;
  const release = 0;
  const revision = 0;
  const patch = 0;

  const instrs = buildInfos.class.cinitBody.code;

  console.log(((instrs[4] as IFindpropstrictInstr).name as IQName).name);

  return { major, minor, release, revision, patch };
}
