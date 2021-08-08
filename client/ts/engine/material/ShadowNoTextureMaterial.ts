import { mat4 } from "gl-matrix";
import { ShaderProgramBuilder } from "../gl/ShaderProgramBuilder";
import { GameContext } from "../GameContext";
import { AttributeType, Model } from "../model/Model";
import { Material } from "./Material";

export class ShadowNoTextureMaterial implements Material {
  private prog: WebGLProgram;
  private ctx: GameContext;

  modelMat: mat4;
  shadowMat: mat4;

  private attribs: {
    position: number;
  }

  private locs: {
    model_matrix: WebGLUniformLocation,
    shadow_matrix: WebGLUniformLocation
  };

  constructor(ctx: GameContext) {
    this.ctx = ctx,
    this.prog = null;

    this.modelMat = mat4.create();
    this.shadowMat = mat4.create();

    mat4.identity(this.modelMat);
    mat4.identity(this.shadowMat);

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/shadownotexture/shadownotexture.vert")
      .withFragmentShader("../glsl/shadownotexture/shadownotexture.frag")
      .build()
      .then((prog) => {
        this.prog = prog;
        let gl = this.ctx.getGLContext();

        this.locs = {
          model_matrix: gl.getUniformLocation(prog, "model_matrix"),
          shadow_matrix: gl.getUniformLocation(prog, "shadow_matrix")
        }

        this.attribs = {
          position: gl.getAttribLocation(prog, "position")
        }
      })
      .catch((err) => {
        console.error(err);
      })
  }

  drawMaterial(model: Model) {
    let gl = this.ctx.getGLContext();
    if (this.prog !== null) {
      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(this.locs.model_matrix, false, this.modelMat);
      gl.uniformMatrix4fv(this.locs.shadow_matrix, false, this.shadowMat);
      model.bindAttribute(AttributeType.POSITION, this.attribs.position);

      model.draw();
    }
  }
}