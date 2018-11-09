import { IMetadata } from "@/extractor/metadata";
import { writeFileSync } from "fs";
import { join } from "path";

export function buildMetadata(meta: IMetadata, path: string) {
  const top = ["export class Metadata {"];
  const data: string[] = [];
  const end = ["}\n"];

  data.push(`  public static PROTOCOL_BUILD: number = ${meta.protocolBuild};`);
  data.push(
    `  public static PROTOCOL_REQUIRED_BUILD: number = ${
      meta.protocolRequiredBuild
    };`
  );
  data.push(
    `  public static PROTOCOL_DATE: string = "${meta.protocolDate.toLocaleString()}";`
  );
  data.push(
    `  public static PROTOCOL_VISIBILITY: string = "${
      meta.protocolVisibility
    }";`
  );

  writeFileSync(
    join(path, "./com/ankamagames/dofus/network/metadata.ts"),
    top.concat(data, end).join("\n")
  );
}
