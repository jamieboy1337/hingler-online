import { FileLoader } from "./loaders/FileLoader";
import { GLTFLoader } from "./loaders/GLTFLoader";

/**
 * A Context aims to provide consistent information to all components on the state of execution.
 */
export interface GameContext {
  /**
   * true if the device is detected as a mobile device, false otherwise.
   */
  readonly mobile;

  /**
   * @returns the delta on the last frame, in seconds.
   */
  getDelta() : number;

  /**
   * @returns a reference to this context's file loader.
   */
  getFileLoader() : FileLoader;

  /**
   * @returns a reference to this context's GLTF loader.
   * TODO: figure out how to organize our file loaders efficiently.
   */
  getGLTFLoader() : GLTFLoader;

  /**
   * @returns the present GL rendering context.
   */
  getGLContext() : WebGLRenderingContext;

  /**
   * @returns the XY size of the window, in pixels
   */
  getScreenDims() : [number, number];
}