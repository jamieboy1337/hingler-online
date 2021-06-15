import { expect } from "chai";
import { ShaderFileLoaderNode } from "../server/ShaderFileLoaderNode";
import { ShaderFileParser } from "../client/ts/gl/ShaderFileParser";

describe("ShaderFileParser", function() {
  it("Should read a plain shader", async function() {
    let loader = new ShaderFileLoaderNode();
    let parser = new ShaderFileParser(loader);

    let file = await parser.parseShaderFile("./test/data/shader-a.txt");
    expect(file).to.equal("yourmother");
  });

  it("Should handle include statements", async function() {
    let loader = new ShaderFileLoaderNode();
    let parser = new ShaderFileParser(loader);

    let file = await parser.parseShaderFile("./test/data/shader-b.txt");
    let test = await parser.parseShaderFile("./test/data/shader-b-parsed.txt");
    expect(file).to.equal(test);
  })
});