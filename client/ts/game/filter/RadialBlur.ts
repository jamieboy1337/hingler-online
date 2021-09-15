// radial blur filter
// accept two framebuffers, and perform a radial blur on them

import { vec2 } from "gl-matrix";
import { GameContext } from "../../engine/GameContext";
import { Framebuffer } from "../../engine/gl/Framebuffer";
import { ShaderProgramBuilder } from "../../engine/gl/ShaderProgramBuilder";
import { PostProcessingFilter } from "../../engine/material/PostProcessingFilter";
import { RenderContext } from "../../engine/render/RenderContext";

export class RadialBlur extends PostProcessingFilter {
  private prog: WebGLProgram;
  // attribute
  private aPosition: number;

  // uniforms
  private uBlurColor: WebGLUniformLocation;
  private glowCenter: WebGLUniformLocation;
  private samples: WebGLUniformLocation;
  private blurSize: WebGLUniformLocation;

  sampleCount: number;
  size: number;
  center: vec2;

  constructor(ctx: GameContext) {
    super(ctx);
    this.prog = null;
    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/radialblur/radialblur.vert")
      .withFragmentShader("../glsl/game/radialblur/radialblur.frag")
      .build()
      .then(this.prepareUniforms.bind(this));
  }

  private prepareUniforms(prog: WebGLProgram) {
    let gl = this.getContext().getGLContext();
    this.prog = prog;
    this.aPosition = gl.getAttribLocation(prog, "aPosition");

    this.uBlurColor = gl.getUniformLocation(prog, "uBlurColor");
    this.glowCenter = gl.getUniformLocation(prog, "glowCenter");
    this.samples = gl.getUniformLocation(prog, "samples");
    this.blurSize = gl.getUniformLocation(prog, "blurSize");
  }

  runFilter(src: Framebuffer, dst: Framebuffer, rc: RenderContext) {
    if (this.prog !== null) {
      let gl = this.getContext().getGLContext();
      // copy src to dst
      // return boolean if any work done? i dont want to have to copy the fb over :(
      dst.bindFramebuffer(gl.FRAMEBUFFER);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        
      gl.useProgram(this.prog);
      src.getColorTexture().bindToUniform(this.uBlurColor, 1);
      gl.uniform2fv(this.glowCenter, this.center);
      gl.uniform1i(this.samples, this.sampleCount);
      gl.uniform1f(this.blurSize, this.size);

      let buf = this.getScreenBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);

      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.aPosition);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(this.aPosition);
    }
  }
}