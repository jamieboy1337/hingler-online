import { perf } from "../../../../../ts/performance";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";
import { GLTFLoaderImpl } from "../loaders/internal/GLTFLoaderImpl";

/**
 * INTERNAL ONLY.
 */
export class EngineContext implements GameContext {
  private lastTimePoint: number;
  private lastDelta: number;
  private loader: FileLoader;
  private gltfLoader: GLTFLoaderImpl;
  private glContext: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;


  constructor(canvas: HTMLCanvasElement) {
    this.lastDelta = 0;
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    this.canvas = canvas;
    this.glContext = canvas.getContext("webgl");
    this.gltfLoader = new GLTFLoaderImpl(this.loader, this.glContext);

    let gl = this.glContext;

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  getDelta() {
    return this.lastDelta;
  }

  updateDelta() {
    let timept = perf.now();
    this.lastDelta = (timept - this.lastTimePoint) / 1000;
    this.lastTimePoint = timept;
  }

  getFileLoader() {
    return this.loader;
  }

  getGLTFLoader() {
    return this.gltfLoader;
  }

  getGLContext() {
    return this.glContext;
  }

  getScreenDims() {
    // testing: https://docs.cypress.io/api/commands/viewport#Syntax
    // note: this is slow, cache once a frame instead
    let dims : [number, number] = [this.canvas.clientWidth, this.canvas.clientHeight];
    return dims;
  }

  step() {
    // handle everything in engine
    this.updateDelta();
    // what else?
    // i'd want to update the scene (not right now)
    // that's it i think
    // scene swaps should still be cued via our context...
    // but the engine should facilitate the creation of a new context
    // it works a bit better here bc we can duplicate our sound library
    // the best solution in the cpp engine would be to create those components
    // as singletons and pass them in as ctor args that way we didnt have to bother
    // with passing that shit around
  }
}