import { IProtocol } from "@base/extractor";
import { ID2Class } from "@base/extractor/classes";
import { writeFileSync } from "fs";
import { join, sep } from "path";
import { mkdirRecursive } from "./helpers/files";
import { replaceAll } from "./helpers/strings";
import { getType } from "./helpers/types";

export function createFileAndDirs(protocol: IProtocol, outputPath: string) {
  for (const m of protocol.messages) {

    const baseImport = [
      'import ByteArray from "@dofus/ByteArray";',
      'import { CustomDataWrapper } from "@dofus/network/CustomDataWrapper";',
      'import { ICustomDataInput } from "@dofus/network/ICustomDataInput";',
      'import { ICustomDataOutput } from "@dofus/network/ICustomDataOutput";',
      'import { INetworkMessage } from "@dofus/network/INetworkMessage";'
    ];

    
    const path = replaceAll(join(outputPath, m.package), ".", "/");
    mkdirRecursive(path);
    let parent: ID2Class | undefined;
    const types: ID2Class[] = [];
    if (m.parent !== "") {
      parent = protocol.messages.find(msg => msg.parent === m.parent)!;
      const packageName = replaceAll(
        m.package.split("com.ankamagames.dofus.")[1],
        ".",
        "/"
      );
      baseImport.push(
        `import { ${parent.name} } from "@dofus/${packageName}";`
      );
    } else {
      baseImport.push(
        `import { NetworkMessage } from "@/dofus/network/NetworkMessage";`
      );
    }

    let useBBW = m.fields.filter(field => field && field.useBBW);
    if (useBBW.length > 0) {
      useBBW = useBBW.sort((a, b) => a.bbwPosition! - b.bbwPosition!);
      baseImport.push(
        'import { BooleanByteWrapper } from "@dofus/network/utils/BooleanByteWrapper";'
      );
    }

    for (const f of m.fields.filter(field => !field.useBBW)) {
      const type = protocol.types.find(t => f.type === t.name);
      if (type) {
        if (!types.includes(type)) {
          types.push(type);
        }
      }
    }

    for (const t of types) {
      const packageName = replaceAll(
        t.package.split("com.ankamagames.dofus.")[1],
        ".",
        "/"
      );
      baseImport.push(`import { ${t.name} } from "@dofus/${packageName}";`);
    }

    const core: string[] = [];

    core.push(
      `\nexport class ${m.name} extends ${
        parent ? parent.name : "NetworkMessage"
      } implements INetworkMessage {
      `
    );

    for (const f of m.fields) {
      let type = getType(f.type);

      if (!type) {
        type = f.type;
      }

      if (f.isVector) {
        type = type + "[]";
      }
      core.push(`  public ${f.name}: ${type};`);
    }

    console.log(baseImport.length, m.name)
    const toWrite = baseImport.concat(core).join("\n");
    writeFileSync(join(path, m.name + ".ts"), toWrite);
  }
}
