import { unlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { SwfReader } from "xswf";
import { ITagDoAbc, TagCode } from "xswf/dist/Types";
import Downloader from "./Downloader";
import { extract, IProtocol } from "./extractor";

const downloadPath = join(homedir(), "DofusInvoker.swf");

export default class CookieBuilder {
  public static async extract(path?: string): Promise<IProtocol> {
    return new Promise<IProtocol>(async resolve => {
      if (!path) {
        const { handler } = await Downloader.getDownload(downloadPath);
        handler().then(() => {
          const protocol = this.extractSwf(downloadPath);
          unlinkSync(downloadPath);
          return resolve(protocol);
        });
      } else {
        return resolve(this.extractSwf(path));
      }
    });
  }

  private static extractSwf(path: string): IProtocol {
    const reader = new SwfReader(path);
    const file = reader.getFile();
    const doAbc = file.tags.find(
      tag => tag.code === TagCode.DoABC
    ) as ITagDoAbc;
    const abcFile = doAbc.abcFile;
    return extract(abcFile);
  }
}
