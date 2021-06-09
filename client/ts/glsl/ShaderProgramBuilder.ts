// build shaders from scratch
// support include syntax path relative
// i already wrote this in cpp :)

import { ShaderFileLoader } from "./loaders/ShaderFileLoader";

/**
 * Builds shaders from files.
 * Also supports non-standard include syntax for incorporating shader code from other files.
 */
export class ShaderProgramBuilder {
  private gl: WebGLRenderingContext;
  private shaderVert: WebGLShader;
  private shaderFrag: WebGLShader;
  private fileLoader: ShaderFileLoader;

  constructor(gl: WebGLRenderingContext, loader?: ShaderFileLoader) {
    this.gl = gl;
    this.shaderVert = null;
    this.shaderFrag = null;

    if (!loader) {
      
    }
  }

  withVertexShader(vertexPath: string) {
    // cue an async method which will build the shader
  }

  private async createShaderFromFile_(shaderPath: string, shaderType: number) {
    const gl = this.gl;
    let shader = gl.createShader(shaderType);
    let contents = await this.getFileContents_(shaderPath);

  }

  private async getFileContents_(shaderPath: string) : Promise<string> {
    const includeHeader = "#include "
    const includeExtract = /\s*#include\s+<\"(.*)\">.*/g

    let shaderResponse = await fetch(shaderPath);
    let folder = shaderPath.substring(0, shaderPath.lastIndexOf("/\\") + 1);
  
    let text = await shaderResponse.text();
    let lines = text.split("\n");
    let output = [];
    
    for (let line of lines) {
      if (line.indexOf(includeHeader) !== -1) {
        let match = includeExtract.exec(line);
        if (match) {
          console.log(match[1]);
          let relativePath = folder + match;
          console.log(relativePath);
          output.push(this.getFileContents_(relativePath));
          continue;
        }
      }

      output.push(line);
    }

    return output.join("\n");
  }
}