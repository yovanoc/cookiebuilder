import { expect } from 'chai';
import CookieBuilder from '../src/Library';

describe('Main Tests', () => {
  let builder: CookieBuilder;

  beforeEach(() => {
    builder = new CookieBuilder();
  });

  it('instanciates the class', () => {
    const result = expect(builder).not.undefined;
  });
});
