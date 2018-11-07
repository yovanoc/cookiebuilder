import { ID2Class } from "@/extractor/classes";
import { writeFileSync } from "fs";
import { join } from "path";
import { cleanNamespace, mkdirRecursive } from "./utils";

export function buildTypes(types: ID2Class[], path: string) {
  const importsIndex: string[] = [];
  const exportsIndex: string[] = [];
  const importsProtocolTypeManager: string[] = [
    `import { INetworkType } from "@dofus/network/INetworkType";`,
    `import Types from "@dofus/network/types";`,
    "",
    "export class ProtocolTypeManager {",
    "  public static getInstance(typeId: number): INetworkType {",
    "    const loc3 = ProtocolTypeManager.list[typeId];",
    "    if (!loc3) {",
    `      throw new Error("Type with id " + typeId + " is unknown.");`,
    "    }",
    "    return loc3();",
    "  }",
    "",
    "  private static list: { [idx: number]: () => INetworkType } = {"
  ];
  const entriesProtocolTypeManager: string[] = [];
  const endProtocolTypeManager = ["  };", "}\n"];
  exportsIndex.push("export default {");
  for (const t of types) {
    const clean = cleanNamespace(t.package);
    importsIndex.push(`import { ${t.name} } from "@${clean}/${t.name}";`);
    entriesProtocolTypeManager.push(
      `    ${t.protocolId}: () => new Types.${t.name}(),`
    );
    exportsIndex.push(`  ${t.name},`);
    const folderPath = join(path, clean);
    mkdirRecursive(folderPath);

    const head = [`export class ${t.name} {`];

    const bottom = ["}\n"];

    const all = head.concat(bottom).join("\n");

    const filePath = join(folderPath, `${t.name}.ts`);
    // console.log(`Writing Type: ${filePath} ...`);
    writeFileSync(filePath, all);
  }
  const lastExport = exportsIndex.pop()!;
  exportsIndex.push(lastExport.slice(0, -1));
  const lastExportProtocolTypeManager = entriesProtocolTypeManager.pop()!;
  entriesProtocolTypeManager.push(lastExportProtocolTypeManager.slice(0, -1));
  exportsIndex.push(`};\n`);
  writeFileSync(
    join(path, "./dofus/network/types/index.ts"),
    importsIndex.concat(["\n"], exportsIndex).join("\n")
  );
  writeFileSync(
    join(path, "./dofus/network/ProtocolTypeManager.ts"),
    importsProtocolTypeManager
      .concat(entriesProtocolTypeManager, endProtocolTypeManager)
      .join("\n")
  );
}
