import { perf } from "../../../../../ts/performance";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";

/**
 * INTERNAL ONLY.
 */
export class EngineContext implements GameContext {
  private lastTimePoint: number;
  private lastDelta: number;
  private loader: FileLoader;
  private glContext: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext) {
    this.lastDelta = 0;
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    this.glContext = gl;
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

  getGLContext() {
    return this.glContext;
  }

  getScreenDims() {
    // testing: https://docs.cypress.io/api/commands/viewport#Syntax
    let dims : [number, number] = [window.innerWidth, window.innerHeight];
    return dims;
  }
}