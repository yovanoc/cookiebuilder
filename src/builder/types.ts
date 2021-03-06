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
  const importsProtocolTypeManager: string[] = [
    `import { INetworkType } from "@com/ankamagames/jerakine/network/INetworkType";`,
    `import * as Types from "@com/ankamagames/dofus/network/types";`,
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
  for (const t of protocol.types) {
    const clean = cleanNamespace(t.package);
    importsIndex.push(`export { ${t.name} } from "@${clean}/${t.name}";`);
    entriesProtocolTypeManager.push(
      `    ${t.protocolId}: () => new Types.${t.name}(),`
    );
    const folderPath = join(path, clean);
    mkdirRecursive(folderPath);

    const importsFile: string[] = [
      `import { ICustomDataInput } from "@com/ankamagames/jerakine/network/ICustomDataInput";`,
      `import { ICustomDataOutput } from "@com/ankamagames/jerakine/network/ICustomDataOutput";`,
      `import { INetworkType } from "@com/ankamagames/jerakine/network/INetworkType";`
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
    const all = importsFile.concat([""], head, body, bottom).join("\n");

    const filePath = join(folderPath, `${t.name}.ts`);
    // console.log(`Writing Type: ${filePath} ...`);
    writeFileSync(filePath, all);
  }

  const lastExportProtocolTypeManager = entriesProtocolTypeManager.pop()!;
  entriesProtocolTypeManager.push(lastExportProtocolTypeManager.slice(0, -1));
  writeFileSync(
    join(path, "./com/ankamagames/dofus/network/types/index.ts"),
    importsIndex.join("\n")
  );
  writeFileSync(
    join(path, "./com/ankamagames/dofus/network/ProtocolTypeManager.ts"),
    importsProtocolTypeManager
      .concat(entriesProtocolTypeManager, endProtocolTypeManager)
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
      `import { BooleanByteWrapper } from "@com/ankamagames/jerakine/network/utils/BooleanByteWrapper";`
    );
    bbw = bbw.sort((a, b) => a.bbwPosition! - b.bbwPosition!);
    serializeBody.push("    let b = 0;");
    deserializeBody.push("    const b = reader.readByte();");
    for (const b of bbw) {
      data.push(`  public ${b.name}: boolean = false;`);
      resetBody.push(`    this.${b.name} = false;`);
      serializeBody.push(
        `    b = BooleanByteWrapper.setFlag(b, ${b.bbwPosition}, this.${
        b.name
        });`
      );
      deserializeBody.push(
        `    this.${b.name} = BooleanByteWrapper.getFlag(b, ${b.bbwPosition});`
      );
    }
    serializeBody.push("    writer.writeByte(b);");
  }

  const usedImports: Map<string, string> = new Map();
  let protocolTypeManagerAlreadyImported = false;

  for (const o of others) {
    let realType = getRealType(o.type);
    let initValue = getDefaultInitValue(realType);
    const isCustomType = realType === "";
    if (isCustomType) {
      const alreadyImported = usedImports.has(o.type);
      if (!alreadyImported) {
        const type = protocol.types.find(ty => ty.name === o.type)!;
        const cleanNs = cleanNamespace(type.package);

        imports.push(`import { ${o.type} } from "@${cleanNs}/${o.type}";`);
        usedImports.set(o.type, "ALREADY");
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
    resetBody.push(`    this.${o.name} = ${initValue};`);

    if (o.useTypeManager && !protocolTypeManagerAlreadyImported) {
      imports.push(
        `import { ProtocolTypeManager } from "@com/ankamagames/dofus/network/ProtocolTypeManager";`
      );
      protocolTypeManagerAlreadyImported = true;
    }

    if (o.isVector) {
      if (o.useTypeManager) {
        serializeBody.push(`    writer.writeShort(this.${o.name}.length);`);
        deserializeBody.push(
          `    const ${o.name}Length = reader.readUnsignedShort();`
        );
      } else if (o.isDynamicLength && o.writeLengthMethod !== "writeShort") {
        serializeBody.push(
          `    writer.${o.writeLengthMethod}(this.${o.name}.length);`
        );
        deserializeBody.push(
          `    const ${o.name}Length = reader.${o.writeLengthMethod!.replace(
            "write",
            "read"
          )}();`
        );
      } else if (!o.length) {
        serializeBody.push(`    writer.writeShort(this.${o.name}.length);`);
        deserializeBody.push(
          `    const ${o.name}Length = reader.readUnsignedShort();`
        );
      }
      if (o.useTypeManager || isCustomType) {
        if (o.useTypeManager) {
          serializeBody.push(
            `    for (const e of this.${o.name}) {`,
            `      writer.writeShort(e.getTypeId());`,
            `      e.serialize(writer);`,
            `    }`
          );
          deserializeBody.push(
            `    for (let i = 0; i < ${
            o.length ? o.length : `${o.name}Length`
            }; i++) {`,
            `      const e = ProtocolTypeManager.getInstance(reader.readUnsignedShort()) as ${
            o.type
            };`,
            `      e.deserialize(reader);`,
            `      this.${o.name}.push(e);`,
            `    }`
          );
        } else {
          serializeBody.push(
            `    for (const e of this.${o.name}) {`,
            `      e.serialize(writer);`,
            `    }`
          );
          deserializeBody.push(
            `    for (let i = 0; i < ${
            o.length ? o.length : `${o.name}Length`
            }; i++) {`,
            `      const e = new ${o.type}();`,
            `      e.deserialize(reader);`,
            `      this.${o.name}.push(e);`,
            `    }`
          );
        }
      } else {
        serializeBody.push(
          `    for (const e of this.${o.name}) {`,
          `      writer.${o.writeMethod}(e);`,
          `    }`
        );
        deserializeBody.push(
          `    for (let i = 0; i < ${
          o.length ? o.length : `${o.name}Length`
          }; i++) {`,
          `      this.${o.name}.push(reader.${o.writeMethod &&
          o.writeMethod.replace("write", "read")}());`,
          `    }`
        );
      }
    } else {
      if (o.useTypeManager) {
        serializeBody.push(
          `    writer.writeShort(this.${o.name}.getTypeId());`
        );
        serializeBody.push(`    this.${o.name}.serialize(writer);`);
        deserializeBody.push(
          `    this.${
          o.name
          } = ProtocolTypeManager.getInstance(reader.readUnsignedShort()) as ${
          o.type
          };`
        );
        deserializeBody.push(`    this.${o.name}.deserialize(reader);`);
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
