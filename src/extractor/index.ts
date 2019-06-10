import { IAbcFile } from "xswf/dist/abcFile/types";
import { extractD2DataCenters, extractD2MessagesAndTypes, ID2Class } from "./classes";
import { extractD2Enums, ID2Enum } from "./enums";
import { extractMetadata, IMetadata } from "./metadata";
import { extractProtocolConstantsEnum } from "./protocolConstantsEnum";
import { extractVersion, IVersion } from "./version";

export interface IProtocol {
  dataCenters: ID2Class[];
  enums: ID2Enum[];
  messages: ID2Class[];
  metadata: IMetadata;
  protocolConstantsEnum: ID2Enum;
  types: ID2Class[];
  version: IVersion;
}

export function extract(abcFile: IAbcFile): IProtocol {
  const { messages, types } = extractD2MessagesAndTypes(abcFile);
  return {
    dataCenters: extractD2DataCenters(abcFile),
    enums: extractD2Enums(abcFile),
    messages,
    metadata: extractMetadata(abcFile)!,
    protocolConstantsEnum: extractProtocolConstantsEnum(abcFile),
    types,
    version: extractVersion(abcFile),
  };
}
