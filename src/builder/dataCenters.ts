import { IProtocol } from "@/extractor";
import { ID2Class } from "@/extractor/classes";
import { writeFileSync } from "fs";
import { join } from "path";
import {
  cleanNamespace,
  getDefaultInitValue,
  getRealType,
  mkdirRecursive
} from "./utils";

export function buildDataCenters(protocol: IProtocol, path: string) {
  for (const m of protocol.dataCenters) {
    const clean = cleanNamespace(m.package);

    const folderPath = join(path, clean);
    mkdirRecursive(folderPath);

    const importsFile: string[] = [];

    if (m.parent !== "") {
      const parent = protocol.dataCenters.find(ty => ty.name === m.parent);
      if (!parent) {
        console.log(`${m.parent} not found.`);
      } else {
        const cleanNs = cleanNamespace(parent.package);
        importsFile.push(
          `import { ${m.parent} } from "@${cleanNs}/${m.parent}";`
        );
      }
    }

    const head = [
      `export class ${m.name} ${m.parent !== "" ? `extends ${m.parent} ` : ""}{`
    ];

    const bottom = ["}\n"];

    const body = buildDataCenter(protocol, m, importsFile);
    const all = importsFile.concat([""], head, body, bottom).join("\n");

    const filePath = join(folderPath, `${m.name}.ts`);
    // console.log(`Writing DataCenter: ${filePath} ...`);
    writeFileSync(filePath, all);
  }
}

function buildDataCenter(
  protocol: IProtocol,
  m: ID2Class,
  imports: string[]
): string[] {
  const data: string[] = [];
  const usedImports: Map<string, string> = new Map();

  for (const o of m.fields) {
    let realType = getRealType(o.type);
    let initValue = getDefaultInitValue(realType);
    const isCustomType = realType === "";
    if (isCustomType) {
      const alreadyImported = usedImports.has(o.type);
      if (!alreadyImported) {
        const type = protocol.dataCenters.find(ty => ty.name === o.type);
        if (!type) {
          console.log(`${o.type} not found.`);
        } else {
          const cleanNs = cleanNamespace(type.package);

          imports.push(`import { ${o.type} } from "@${cleanNs}/${o.type}";`);
          usedImports.set(o.type, "ALREADY");
        }
      }
      realType = o.type;
      initValue = `new ${o.type}()`;
    }
    if (o.isVector) {
      realType += "[]";
      initValue = "[]";
    }
    if (o.isVectorVector) {
      realType += "[][]";
      initValue = "[]";
    }
    data.push(`  public ${o.name}: ${realType} = ${initValue};`);
  }

  return data;
}
