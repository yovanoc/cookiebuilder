import { SwfReader } from 'xswf';
import { ITagDoAbc, TagCode } from 'xswf/dist/Types';
import { extract, IProtocol } from './extractor';

export default class CookieBuilder {

  public static extract(path: string): IProtocol {
    const reader = new SwfReader(path);
    const file = reader.getFile();
    const doAbc = file.tags.find((tag) => tag.code === TagCode.DoABC) as ITagDoAbc;
    const abcFile = doAbc.abcFile;
    return extract(abcFile);
  }

}
