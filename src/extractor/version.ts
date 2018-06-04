import { IAbcFile } from 'xswf/dist/abcFile/types';
import { MultinameKind } from 'xswf/dist/abcFile/types/multiname';

export interface IVersion {
  major: number;
  minor: number;
  release: number;
  revision: number;
  patch: number;
}

export function extractVersion(abcFile: IAbcFile): IVersion {
  const klass = abcFile.instances.find(
    (c) => c.name.kind === MultinameKind.QName &&
    c.name.ns.name.startsWith('com.ankamagames.dofus') &&
    c.name.name.includes('BuildInfos'));
  console.log(klass.class.traits);
  return { major: 1, minor: 1, release: 1, revision: 1, patch: 1 };
}
