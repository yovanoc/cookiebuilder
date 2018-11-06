import { readFileSync } from "fs";
import { IProtocol } from "./../extractor/index";
import { createFileAndDirs } from "./lib/messages";

export function generateProtocol(sourcePath: string, outputPath: string) {
  const protocol: IProtocol = JSON.parse(readFileSync(sourcePath).toString());

  createFileAndDirs(protocol, outputPath);
}
