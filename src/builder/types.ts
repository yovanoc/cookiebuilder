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

export function buildTypes(protocol: IProtocol, path: string) {
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
  for (const t of protocol.types) {
    const clean = cleanNamespace(t.package);
    importsIndex.push(`import { ${t.name} } from "@${clean}/${t.name}";`);
    entriesProtocolTypeManager.push(
      `    ${t.protocolId}: () => new Types.${t.name}(),`
    );
    exportsIndex.push(`  ${t.name},`);
    const folderPath = join(path, clean);
    mkdirRecursive(folderPath);

    const importsFile: string[] = [
      `import { ICustomDataInput } from "@dofus/network/ICustomDataInput";`,
      `import { ICustomDataOutput } from "@dofus/network/ICustomDataOutput";`,
      `import { INetworkType } from "@dofus/network/INetworkType";`
    ];

    if (t.parent !== "") {
      const parent = protocol.types.find(ty => ty.name === t.parent)!;
      const cleanNs = cleanNamespace(parent.package);
      importsFile.push(
        `import { ${t.parent} } from "@${cleanNs}/${t.parent}";`
      );
    }

    const head = [
      `export class ${t.name} ${
        t.parent !== "" ? `extends ${t.parent} ` : ""
      }implements INetworkType {`
    ];

    const bottom = ["}\n"];

    const body = buildType(protocol, t, importsFile);
    const all = importsFile.concat(head, body, bottom).join("\n");

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
    importsIndex.concat(exportsIndex).join("\n")
  );
  writeFileSync(
    join(path, "./dofus/network/ProtocolTypeManager.ts"),
    importsProtocolTypeManager
      .concat([""], entriesProtocolTypeManager, endProtocolTypeManager)
      .join("\n")
  );
}

function buildType(
  protocol: IProtocol,
  t: ID2Class,
  imports: string[]
): string[] {
  const data: string[] = [];
  data.push(`  public static readonly ID: number = ${t.protocolId};`);

  if (t.fields.length > 0) {
    data.push("");
  }

  let bbw = t.fields.filter(f => f.useBBW);
  const others = t.fields.filter(f => !f.useBBW);

  const resetBody: string[] = [];
  const serializeBody: string[] = [];
  const deserializeBody: string[] = [];

  if (t.parent !== "") {
    resetBody.push("    super.reset();");
    serializeBody.push("    super.serialize(writer);");
    deserializeBody.push("    super.deserialize(reader);");
  }

  if (bbw.length > 0) {
    imports.push(
      `import { BooleanByteWrapper } from "@dofus/network/utils/BooleanByteWrapper";`
    );
    bbw = bbw.sort((a, b) => a.bbwPosition! - b.bbwPosition!);
    for (const b of bbw) {
      data.push(`  public ${b.name}: boolean = false;`);
      resetBody.push(`    this.${b.name} = false;`);
      serializeBody.push(
        `    writer.writeByte(BooleanByteWrapper.setFlag(this.${b.name}, ${
          b.bbwPosition
        }));`
      );
      deserializeBody.push(
        `    this.${b.name} = BooleanByteWrapper.getFlag(reader.readByte(), ${
          b.bbwPosition
        });`
      );
    }
  }

  for (const o of others) {
    let realType = getRealType(o.type);
    let initValue = getDefaultInitValue(realType);
    const isCustomType = realType === "";
    if (isCustomType) {
      const type = protocol.types.find(ty => ty.name === o.type)!;
      const cleanNs = cleanNamespace(type.package);
      imports.push(`import { ${o.type} } from "@${cleanNs}/${o.type}";`);
      realType = o.type;
      initValue = `new ${o.type}()`;
    }
    if (o.isVector) {
      realType += "[]";
      initValue = "[]";
    }
    data.push(`  public ${o.name}: ${realType} = ${initValue};`);
    resetBody.push(`    this.${o.name} = ${initValue};`);

    if (o.useTypeManager) {
      imports.push(
        `import { ProtocolTypeManager } from "@dofus/network/ProtocolTypeManager";\n`
      );
    }

    if (o.isVector) {
      if (o.useTypeManager) {
        //
      } else {
        //
      }
      serializeBody.push(`    writer.writeShort(this.${o.name}.length);`);
      serializeBody.push(
        `    for (const e of this.${o.name}) {`,
        `      writer.${o.writeMethod}(e);`,
        `    }`
      );
      deserializeBody.push(`    const ${o.name}Length = reader.readShort();`);
      deserializeBody.push(
        `    this.${o.name} = [];`,
        `    for (let i = 0; i < ${o.name}Length; i++) {`,
        `      this.${o.name}.push(reader.${o.writeMethod &&
          o.writeMethod.replace("write", "read")}());`,
        `    }`
      );
    } else {
      if (o.useTypeManager) {
        serializeBody.push(`    this.${o.name}.serialize(writer);`);
        deserializeBody.push(
          `    this.${
            o.name
          } = ProtocolTypeManager.getInstance(reader.readShort());`
        );
      } else {
        if (isCustomType) {
          serializeBody.push(`    this.${o.name}.serialize(writer);`);
          deserializeBody.push(`    this.${o.name} = new ${o.type}();`);
          deserializeBody.push(`    this.${o.name}.deserialize(reader);`);
        } else {
          serializeBody.push(`    writer.${o.writeMethod}(this.${o.name});`);
          deserializeBody.push(
            `    this.${o.name} = reader.${
              o.writeMethod
                ? o.writeMethod.replace("write", "read")
                : `${o.method}`
            }();`
          );
        }
      }
    }
  }

  data.push(
    "",
    "  public getTypeId(): number {",
    `    return ${t.name}.ID;`,
    "  }"
  );

  data.push("", "  public reset(): void {");
  if (resetBody.length === 0) {
    resetBody.push("    //");
  }
  data.push(...resetBody);
  data.push("  }");

  data.push("", "  public serialize(writer: ICustomDataOutput): void {");
  if (serializeBody.length === 0) {
    serializeBody.push("    //");
  }
  data.push(...serializeBody);
  data.push("  }");

  data.push("", "  public deserialize(reader: ICustomDataInput): void {");
  if (deserializeBody.length === 0) {
    deserializeBody.push("    //");
  }
  data.push(...deserializeBody);
  data.push("  }");

  return data;
}
