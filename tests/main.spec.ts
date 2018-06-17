import { expect } from "chai";
import { IProtocol } from "../src/extractor";
import CookieBuilder from "../src/Library";

describe("Main Tests", () => {
  let builder: CookieBuilder;
  let protocol: IProtocol;

  beforeEach(() => {
    builder = new CookieBuilder();
    protocol = CookieBuilder.extract("./tests/DofusInvoker.swf");
  });

  it("instanciates the class", () => {
    const result = expect(builder).not.undefined;
  });

  it("get the protocol", () => {
    const result = expect(protocol).not.undefined;
  });

  it("should have enums", () => {
    const result = expect(protocol.enums.length).to.equal(95);
  });
});
