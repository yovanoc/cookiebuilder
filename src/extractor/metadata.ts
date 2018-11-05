import { IAbcFile } from "xswf/dist/abcFile/types";
import { MultinameKind } from "xswf/dist/abcFile/types/multiname";
import { ITraitSlot, TraitKind } from "xswf/dist/abcFile/types/trait";

export interface IMetadata {
  protocolBuild: number;
  protocolRequiredBuild: number;
  protocolDate: Date;
  protocolVisibility: string;
}

export function extractMetadata(abcFile: IAbcFile): IMetadata | undefined {
  const klass = abcFile.instances.find(
    c =>
      c.name.kind === MultinameKind.QName &&
      c.name.ns.name.startsWith("com.ankamagames.dofus.network") &&
      c.name.name.includes("Metadata")
  );
  if (!klass) {
    return;
  }
  const traits: ITraitSlot[] = klass.class.traits.filter(t => {
    return (
      t.kind === TraitKind.Const &&
      t.name.kind === MultinameKind.QName &&
      t.name.name.includes("PROTOCOL_")
    );
  }) as ITraitSlot[];

  let protocolBuild: number = 0;
  let protocolRequiredBuild: number = 0;
  let protocolDate: Date = new Date();
  let protocolVisibility: string = "";

  for (const trait of traits) {
    if (
      trait.kind !== TraitKind.Const ||
      trait.name.kind !== MultinameKind.QName ||
      !trait.name.name.includes("PROTOCOL_")
    ) {
      return;
    }
    switch (trait.name.name) {
      case "PROTOCOL_BUILD": {
        protocolBuild = trait.value!.val as number;
        break;
      }
      case "PROTOCOL_REQUIRED_BUILD": {
        protocolRequiredBuild = trait.value!.val as number;
        break;
      }
      case "PROTOCOL_DATE": {
        protocolDate = new Date(trait.value!.val as string);
        break;
      }
      case "PROTOCOL_VISIBILITY": {
        protocolVisibility = trait.value!.val as string;
        break;
      }
      default:
        break;
    }
  }
  return {
    protocolBuild,
    protocolDate,
    protocolRequiredBuild,
    protocolVisibility
  };
}
