import { IQName, MultinameKind } from 'xswf/dist/abcFile/types/multiname';
import { IInstanceInfo } from 'xswf/dist/abcFile/types/instance';
import { TraitKind } from 'xswf/dist/abcFile/types/trait';
import { ConstantKind } from 'xswf/dist/abcFile/types/constant';
import { IAbcFile } from 'xswf/dist/abcFile/types';

export type D2EnumEntry = {
  name: string,
  value: number,
};

export type D2Enum = {
  package: string,
  name: string,
  entries: D2EnumEntry[],
};

export function extractD2Enum(klass: IInstanceInfo) {
  if (
    klass.name.kind !== MultinameKind.QName ||
    klass.name.ns.name !== 'com.ankamagames.dofus.network.enums'
  ) {
    throw new Error('invalid input class');
  }

  let d2Enum: D2Enum = {
    package: klass.name.ns.name,
    name: klass.name.name,
    entries: []
  };

  klass.class.traits.forEach(trait => {
    if (trait.kind !== TraitKind.Const) {
      return;
    }

    const name = (trait.name as IQName).name;

    if (trait.value.kind !== ConstantKind.Int) {
      throw new Error("aren't all enum values integers?!");
    }

    const value = trait.value.val;

    d2Enum.entries.push({ name, value });
  });

  return d2Enum;
}


export function extractD2Enums(abcFile: IAbcFile): D2Enum[] {
  return abcFile.instances.filter(
    c => c.name.kind === MultinameKind.QName &&
    c.name.ns.name.startsWith('com.ankamagames.dofus.network.enums')
  ).map(extractD2Enum);
}
