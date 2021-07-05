import { expect } from "chai";
import { FileLoader } from "../../client/ts/game/engine/loaders/FileLoader";
import { GLTFLoaderImpl } from "../../client/ts/game/engine/loaders/internal/GLTFLoaderImpl";

describe("GLTFLoader", function() {
  it("Should read a plain scene", function() {
    let temp = new FileLoader();
    let loader = new GLTFLoaderImpl(temp);
    let res = loader.loadGLTFModel("../data/test.glb");
    expect(res).is.not.null;
  })
})