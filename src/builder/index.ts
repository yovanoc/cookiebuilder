import { IProtocol } from "@/extractor";
import { buildEnums } from "./enums";
import { buildMessages } from "./messages";
import { buildMetadata } from "./metadata";
import { buildTypes } from "./types";
import { mkdirRecursive, rimraf } from "./utils";

export function build(protocol: IProtocol, path: string) {
  // rimraf(path);
  mkdirRecursive(path);
  buildMetadata(protocol.metadata, path);
  buildEnums(protocol.enums, path);
  buildTypes(protocol.types, path);
  buildMessages(protocol.messages, path);
}
