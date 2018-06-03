import { IAbcFile } from 'xswf/dist/abcFile/types';
import { extractD2Enums, ID2Enum } from './enums';

export interface IProtocol {
  enums: ID2Enum[];
}

export function extract(abcFile: IAbcFile): IProtocol {
  return {
    enums: extractD2Enums(abcFile),
  };
}
