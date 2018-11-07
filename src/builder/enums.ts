import { ID2Enum } from "@/extractor/enums";
import { writeFileSync } from "fs";
import { join } from "path";
import { cleanNamespace, mkdirRecursive } from "./utils";

export function buildEnums(enums: ID2Enum[], path: string) {
  for (const e of enums) {
    const folderPath = join(path, cleanNamespace(e.package));
    mkdirRecursive(folderPath);

    const head = [`export enum ${e.name} {`];

    const entries = e.entries
      .map(en => {
        return `  ${en.name} = ${en.value},`;
      })
      .join("\n");

    const bottom = ["}\n"];

    const all = head.concat(entries, bottom).join("\n");

    const filePath = join(folderPath, `${e.name}.ts`);
    // console.log(`Writing Enum: ${filePath} ...`);
    writeFileSync(filePath, all);
  }
}
