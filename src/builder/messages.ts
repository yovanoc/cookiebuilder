import { IProtocol } from "@/extractor";
import { ID2Class } from "@/extractor/classes";
import { writeFileSync } from "fs";
import { join } from "path";
import { cleanNamespace, mkdirRecursive } from "./utils";

export function buildMessages(protocol: IProtocol, path: string) {
  const importsIndex: string[] = [];
  const exportsIndex: string[] = [];
  const importsMessageReceiver: string[] = [
    `import { CustomDataWrapper } from "@dofus/network/CustomDataWrapper";`,
    `import { INetworkMessage } from "@dofus/network/INetworkMessage";`,
    `import Messages from "@dofus/network/messages";`,
    "",
    "export class MessageReceiver {",
    "  public static parse(",
    "    wrapper: CustomDataWrapper,",
    "    id: number",
    `  ): INetworkMessage {`,
    "    const messageTmp = MessageReceiver.list[id];",
    "    if (!messageTmp) {",
    `      throw new Error("Message with id " + id + " is unknown.");`,
    "    }",
    "    const message = messageTmp();",
    "    message.unpack(wrapper);",
    "    return message;",
    "  }",
    "",
    "  private static list: { [idx: number]: () => INetworkMessage } = {"
  ];
  const entriesMessageReceiver: string[] = [];
  const endMessageReceiver = ["  };", "}\n"];
  exportsIndex.push("export default {");
  for (const m of protocol.messages) {
    const clean = cleanNamespace(m.package);
    importsIndex.push(`import { ${m.name} } from "@${clean}/${m.name}";`);
    entriesMessageReceiver.push(
      `    ${m.protocolId}: () => new Messages.${m.name}(),`
    );
    exportsIndex.push(`  ${m.name},`);
    const folderPath = join(path, clean);
    mkdirRecursive(folderPath);

    const importsFile: string[] = [];

    const head = [`export class ${m.name} {`];

    const bottom = ["}\n"];

    const body = buildMessage(m, importsFile);
    const all = importsFile.concat(head, body, bottom).join("\n");

    const filePath = join(folderPath, `${m.name}.ts`);
    // console.log(`Writing Message: ${filePath} ...`);
    writeFileSync(filePath, all);
  }
  const lastExport = exportsIndex.pop()!;
  exportsIndex.push(lastExport.slice(0, -1));
  const lastExportMessageReceiver = entriesMessageReceiver.pop()!;
  entriesMessageReceiver.push(lastExportMessageReceiver.slice(0, -1));
  exportsIndex.push(`};\n`);
  writeFileSync(
    join(path, "./dofus/network/messages/index.ts"),
    importsIndex.concat(["\n"], exportsIndex).join("\n")
  );
  writeFileSync(
    join(path, "./dofus/network/MessageReceiver.ts"),
    importsMessageReceiver
      .concat(entriesMessageReceiver, endMessageReceiver)
      .join("\n")
  );
}

function buildMessage(m: ID2Class, imports: string[]): string[] {
  return [];
}
