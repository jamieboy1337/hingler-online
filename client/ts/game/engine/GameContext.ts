import { FileLoader } from "./loaders/FileLoader";

/**
 * A Context aims to provide consistent information to all components on the state of execution.
 */
export interface GameContext {
  /**
   * @returns the delta on the last frame, in seconds.
   */
  getDelta() : number;

  /**
   * @returns a reference to this context's file loader.
   */
  getFileLoader() : FileLoader;

  /**
   * @returns the present GL rendering context.
   */
  getGLContext() : WebGLRenderingContext;
}