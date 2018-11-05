import { IAbcFile } from "xswf/dist/abcFile/types";
import { ConstantKind } from "xswf/dist/abcFile/types/constant";
import { IInstanceInfo } from "xswf/dist/abcFile/types/instance";
import { IQName, MultinameKind } from "xswf/dist/abcFile/types/multiname";
import { TraitKind } from "xswf/dist/abcFile/types/trait";

export interface ID2EnumEntry {
  name: string;
  value: number;
}

export interface ID2Enum {
  package: string;
  name: string;
  entries: ID2EnumEntry[];
}

export function extractD2Enum(klass: IInstanceInfo): ID2Enum {
  if (
    klass.name.kind !== MultinameKind.QName ||
    klass.name.ns.name !== "com.ankamagames.dofus.network.enums"
  ) {
    throw new Error("invalid input class");
  }

  const d2Enum: ID2Enum = {
    package: klass.name.ns.name,
    name: klass.name.name,
    entries: []
  };

  klass.class.traits.forEach(trait => {
    if (trait.kind !== TraitKind.Const) {
      return;
    }

    const name = (trait.name as IQName).name;

    const traitValue = trait.value;

    if (!traitValue || (traitValue && traitValue.kind !== ConstantKind.Int)) {
      throw new Error("aren't all enum values integers?!");
    }

    d2Enum.entries.push({ name, value: traitValue.val });
  });

  return d2Enum;
}

export function extractD2Enums(abcFile: IAbcFile): ID2Enum[] {
  return abcFile.instances
    .filter(
      c =>
        c.name.kind === MultinameKind.QName &&
        c.name.ns.name.startsWith("com.ankamagames.dofus.network.enums")
    )
    .map(extractD2Enum);
}
