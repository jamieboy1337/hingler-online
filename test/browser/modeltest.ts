import { expect } from "chai";
import { FileLoader } from "../../client/ts/engine/loaders/FileLoader";
import { GLTFLoaderImpl } from "../../client/ts/engine/loaders/internal/GLTFLoaderImpl";

const canvas = document.getElementById("test-canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl");

describe("GLTFLoader", function() {
  it("Should read a plain scene", async function() {
    let temp = new FileLoader();
    let loader = new GLTFLoaderImpl(temp, gl);
    let res = await loader.loadGLTFModel("../data/test.glb");
    expect(res).is.not.null;
    
    console.log(res);
  })
})