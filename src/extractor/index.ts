import { IAbcFile } from "xswf/dist/abcFile/types";
import { extractD2MessagesAndTypes, ID2Class } from "./classes";
import { extractD2Enums, ID2Enum } from "./enums";
import { extractMetadata, IMetadata } from "./metadata";
import { extractVersion, IVersion } from "./version";

export interface IProtocol {
  metadata: IMetadata;
  version: IVersion;
  enums: ID2Enum[];
  messages: ID2Class[];
  types: ID2Class[];
}

export function extract(abcFile: IAbcFile): IProtocol {
  const { messages, types } = extractD2MessagesAndTypes(abcFile);
  return {
    metadata: extractMetadata(abcFile)!,
    version: extractVersion(abcFile),
    enums: extractD2Enums(abcFile),
    messages,
    types
  };
}
