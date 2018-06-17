import { IAbcFile } from "xswf/dist/abcFile/types";
import { extractD2Enums, ID2Enum } from "./enums";
import { extractMetadata, IMetadata } from "./metadata";
import { extractVersion, IVersion } from "./version";

export interface IProtocol {
  enums: ID2Enum[];
  metadata: IMetadata;
  version: IVersion;
}

export function extract(abcFile: IAbcFile): IProtocol {
  return {
    enums: extractD2Enums(abcFile),
    metadata: extractMetadata(abcFile),
    version: extractVersion(abcFile)
  };
}
