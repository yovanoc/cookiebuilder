import { expect } from "chai";
import { IProtocol } from "../src/extractor";
import CookieBuilder from "../src/Library";

describe("Main Tests", () => {
  let builder: CookieBuilder;
  let protocol: IProtocol;

  before(async () => {
    builder = new CookieBuilder();
    protocol = await CookieBuilder.extract()!;
  });

  it("instanciates the class", () => {
    const result = expect(builder).not.undefined;
  });

  it("get the protocol", () => {
    const result = expect(protocol).not.undefined;
  });

  it("should have correct version", () => {
    const result = expect(protocol.version).to.deep.equal({
      major: 2,
      minor: 42,
      release: 0,
      revision: 1027565,
      patch: 0
    });
  });

  it("should have enums", () => {
    const result = expect(protocol.enums.length).to.equal(95);
  });

  it("should have messages", () => {
    const result = expect(protocol.messages.length).to.equal(1019);
  });

  it("should have types", () => {
    const result = expect(protocol.types.length).to.equal(301);
  });
});
