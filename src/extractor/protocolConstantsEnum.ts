import { IAbcFile } from "xswf/dist/abcFile/types";
import { ConstantKind } from "xswf/dist/abcFile/types/constant";
import { IQName } from "xswf/dist/abcFile/types/multiname";
import { TraitKind } from "xswf/dist/abcFile/types/trait";
import { ID2Enum } from "./enums";

// ProtocolConstantsEnum

export function extractProtocolConstantsEnum(abc: IAbcFile): ID2Enum {
  const klass = abc.instances.find(
    c => c.name.name === "ProtocolConstantsEnum"
  )!;

  const d2Enum: ID2Enum = {
    entries: [],
    name: klass.name.name,
    package: klass.name.ns.name
  };

  klass.class.traits.forEach(trait => {
    if (trait.kind !== TraitKind.Const) {
      return;
    }

    const name = (trait.name as IQName).name;

    const traitValue = trait.value;

    if (!traitValue) {
      throw new Error("no trait value?");
    }

    if (
      traitValue.kind !== ConstantKind.Int &&
      traitValue.kind !== ConstantKind.Double &&
      traitValue.kind !== ConstantKind.UInt
    ) {
      throw new Error(`aren't all enum values integers?!`);
    }

    d2Enum.entries.push({ name, value: traitValue.val });
  });

  return d2Enum;
}
