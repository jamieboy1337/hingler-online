// build shaders from scratch
// support include syntax path relative
// i already wrote this in cpp :)

import { GameContext } from "../game/engine/GameContext";
import { ShaderFileParser } from "./internal/ShaderFileParser";

/**
 * Builds shaders from files.
 * Also supports non-standard include syntax for incorporating shader code from other files.
 */
export class ShaderProgramBuilder {
  private vertPromise: Promise<WebGLShader>;
  private fragPromise: Promise<WebGLShader>;
  private fileParser: ShaderFileParser;
  private ctx: GameContext;

  constructor(ctx: GameContext) {
    this.vertPromise = null;
    this.fragPromise = null;

    this.ctx = ctx;

    this.fileParser = new ShaderFileParser(this.ctx.getFileLoader());

  }

  /**
   * Builder function which specifies a vertex shader.
   * @param vertexPath - the path to the desired vertex shader.
   * @returns the builder instance.
   */
  withVertexShader(vertexPath: string) {
    // cue an async method which will build the shader
    const gl = this.ctx.getGLContext();
    this.vertPromise = this.createShaderFromFile_(vertexPath, gl.VERTEX_SHADER);
    return this;
  }

  /**
   * Builder which specifies a fragment shader.
   * @param fragmentPath - the path to the desired fragment shader.
   * @returns the builder instance.
   */
  withFragmentShader(fragmentPath: string) {
    const gl = this.ctx.getGLContext();
    this.fragPromise = this.createShaderFromFile_(fragmentPath, gl.FRAGMENT_SHADER);
    return this;
  }

  /**
   * Builds the shader.
   * @returns a promise which rejects if either shader is missing or invalid, or if a link error occurs, and resolves to the compiled program.
   */
  async build() : Promise<WebGLProgram> {
    // since our shaders are async: we ought to come up with a way to return this :(
    // in usage: if the built shader is not ready yet, then perform a no-op when drawing.
    if (this.vertPromise !== null || this.fragPromise !== null) {
      let err = `Missing ${this.vertPromise === null ? "vertex " : ""}${this.vertPromise === null && this.fragPromise === null ? "and " : ""}${this.fragPromise === null ? "fragment " : ""}shader!`;
      console.error(err);
      throw err;
    }

    // errors from compilation will throw here
    let vertShader = await this.vertPromise;
    let fragShader = await this.fragPromise;

    const gl = this.ctx.getGLContext();
    let prog = gl.createProgram();
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      let info = gl.getProgramInfoLog(prog);
      console.error(info);
      throw Error(info);
    }

    return prog;
  }

  private async createShaderFromFile_(shaderPath: string, shaderType: number) : Promise<WebGLShader> {
    const gl = this.ctx.getGLContext();
    let shader = gl.createShader(shaderType);
    let contents = await this.fileParser.parseShaderFile(shaderPath);

    gl.shaderSource(shader, contents);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      let log = gl.getShaderInfoLog(shader);
      console.error(log);
      gl.deleteShader(shader);
      throw Error(log);
    }

    return shader;
  }
}