import { IProtocol } from "@/extractor";
import { buildDataCenters } from "./dataCenters";
import { buildEnums } from "./enums";
import { buildMessages } from "./messages";
import { buildMetadata } from "./metadata";
import { buildProtocolConstantsEnum } from "./protocolConstantsEnum";
import { buildTypes } from "./types";
import { mkdirRecursive, rimraf } from "./utils";

export function build(protocol: IProtocol, path: string) {
  // rimraf(path);
  mkdirRecursive(path);
  buildTypes(protocol, path);
  buildMessages(protocol, path);
  buildDataCenters(protocol, path);
  buildEnums(protocol.enums, path);
  buildMetadata(protocol.metadata, path);
  buildProtocolConstantsEnum(protocol.protocolConstantsEnum, path);
}
