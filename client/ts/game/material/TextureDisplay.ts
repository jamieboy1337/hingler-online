import { ShaderProgramBuilder } from "../../gl/ShaderProgramBuilder";
import { Texture } from "../../gl/Texture";
import { GameContext } from "../engine/GameContext";
import { Material } from "./Material";

// fucking 
const screenCoords = new Float32Array([
  -1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1
]);

export class TextureDisplay {
  private prog: WebGLProgram;
  private ctx: GameContext;

  private buf: WebGLBuffer;

  private attribs: {
    pos: number
  };

  private locs: {
    tex: WebGLUniformLocation;
  }

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    let gl = this.ctx.getGLContext();
    this.prog = null;
    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/texturexfer/texturexfer.vert")
      .withFragmentShader("../glsl/texturexfer/texturexfer.frag")
      .build()
      .then((prog) => {
        this.prog = prog;

        this.attribs = {
          pos: gl.getAttribLocation(prog, "aPosition")
        };

        this.locs = {
          tex: gl.getUniformLocation(prog, "tex")
        };

        console.log(this.locs.tex);
      })
      .catch((err) => {
        console.error(err);
      });

    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, screenCoords, gl.STATIC_DRAW);
  }

  drawTexture(tex: Texture) {
    let gl = this.ctx.getGLContext();
    if (this.prog !== null) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      
      gl.vertexAttribPointer(this.attribs.pos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.attribs.pos);

      tex.bindToUniform(this.locs.tex, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else {
      console.error("what");
    }
  }
}