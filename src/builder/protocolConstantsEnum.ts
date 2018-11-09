import { ID2Enum } from "@/extractor/enums";
import { writeFileSync } from "fs";
import { join } from "path";

export function buildProtocolConstantsEnum(e: ID2Enum, path: string) {
  const head = [`export enum ${e.name} {`];

  const entries = e.entries
    .map(en => {
      return `  ${en.name} = ${en.value},`;
    })
    .join("\n");

  const bottom = ["}\n"];

  const all = head.concat(entries, bottom).join("\n");

  const filePath = join(
    path,
    "./com/ankamagames/dofus/network/ProtocolConstantsEnum.ts"
  );
  // console.log(`Writing Enum: ${filePath} ...`);
  writeFileSync(filePath, all);
}
