// build shaders from scratch
// support include syntax path relative
// i already wrote this in cpp :)

import { Future } from "../../../ts/util/task/Future";
import { Task } from "../../../ts/util/task/Task";
import { GameContext } from "../game/engine/GameContext";
import { ShaderFileParser } from "./internal/ShaderFileParser";

const shaderCache : Map<string, WebGLProgram> = new Map();
const shadersCompiling : Map<string, Promise<void>> = new Map();

let test : WEBGL_debug_shaders;

// kind of a funny singleton thing
// but i dont really care that much
// alternative: come up with a wrapper so that we can run the build function synchronously,
// and the client can just wait for the value to resolve
// we can still use the async ver, just check the cache before queueing it
export class ShaderCache {
  getShaderImmediatelyIfCached(vertPath: string, fragPath: string) {
    let pathString = `${vertPath}|${fragPath}`;
    if (shaderCache.has(pathString)) {
      return shaderCache.get(pathString);
    }

    return null;
  }
}

/**
 * Builds shaders from files.
 * Also supports non-standard include syntax for incorporating shader code from other files.
 */
export class ShaderProgramBuilder {
  private fileParser: ShaderFileParser;
  private ctx: GameContext;

  private vertPath: string;
  private fragPath: string;

  constructor(ctx: GameContext) {
    test = ctx.getGLContext().getExtension("WEBGL_debug_shaders");
    this.vertPath = null;
    this.fragPath = null;
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
    this.vertPath = vertexPath;
    return this;
  }

  /**
   * Builder which specifies a fragment shader.
   * @param fragmentPath - the path to the desired fragment shader.
   * @returns the builder instance.
   */
  withFragmentShader(fragmentPath: string) {
    this.fragPath = fragmentPath;
    return this;
  }

  buildFuture() : Future<WebGLProgram> {
    if (this.vertPath === null || this.fragPath === null) {
      let err = `Missing ${this.vertPath === null ? "vertex " : ""}${this.vertPath === null && this.fragPath === null ? "and " : ""}${this.fragPath === null ? "fragment " : ""}shader!`;
      console.error(err);
      throw err;
    }

    let progTask = new Task<WebGLProgram>();
    
    // errors from compilation will throw here
    let pathString = `${this.vertPath}|${this.fragPath}`;

    if (shaderCache.has(pathString)) {
      progTask.resolve(shaderCache.get(pathString));
    } else if (shadersCompiling.has(pathString)) {
      shadersCompiling.get(pathString).then(() => {
        if (shaderCache.has(pathString)) {
          progTask.resolve(shaderCache.get(pathString));
        }
      })
    } else {
      this.build().then((prog) => {
        progTask.resolve(prog);
      })
    }

    return progTask.getFuture();
  }

  /**
   * Builds the shader.
   * @returns a promise which rejects if either shader is missing or invalid, or if a link error occurs, and resolves to the compiled program.
   */
  async build() : Promise<WebGLProgram> {
    // since our shaders are async: we ought to come up with a way to return this :(
    // in usage: if the built shader is not ready yet, then perform a no-op when drawing.
    if (this.vertPath === null || this.fragPath === null) {
      let err = `Missing ${this.vertPath === null ? "vertex " : ""}${this.vertPath === null && this.fragPath === null ? "and " : ""}${this.fragPath === null ? "fragment " : ""}shader!`;
      console.error(err);
      throw err;
    }

    const gl = this.ctx.getGLContext();
    
    // errors from compilation will throw here
    let pathString = `${this.vertPath}|${this.fragPath}`;
    if (shadersCompiling.has(pathString)) {
      await shadersCompiling.get(pathString);
      // shader is compiling -- wait for completion
    }

    if (shaderCache.has(pathString)) {
      // since we've already waited for compilation: if this is false, the shader has not been compiled yet.
      return shaderCache.get(pathString);
    }
    
    let res: () => void;
    let rej: () => void;
    let progress : Promise<void> = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    shadersCompiling.set(pathString, progress);
    
    let vertShader : WebGLShader;
    let fragShader : WebGLShader;
    
    try {
      vertShader = await this.createShaderFromFile_(this.vertPath, gl.VERTEX_SHADER);
      fragShader = await this.createShaderFromFile_(this.fragPath, gl.FRAGMENT_SHADER);
    } catch (e) {
      console.error(e);
      rej();
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      let info = gl.getProgramInfoLog(prog);
      console.error(info);
      rej();
      throw Error(info);
    }

    // shader is not cached -- cache it!
    shaderCache.set(pathString, prog);
    shadersCompiling.delete(pathString);
    res();
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
      this.printParsedShaderWithLineNumbers(contents);
      throw Error(log);
    }

    return shader;
  }

  private printParsedShaderWithLineNumbers(shader: string) {
    let lines = shader.split(/\r?\n/);
    let breaks = Math.ceil(Math.log10(lines.length + 1)) + 2;
    for (let i = 0; i < lines.length; i++) {
      let numstr = (i + 1).toString(10).padEnd(breaks, " ");
      lines[i] = numstr + lines[i];
    }

    console.warn(lines.join("\r\n"));
  }
}