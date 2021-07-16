import { mat3, mat4, vec4 } from "gl-matrix";
import { ShaderProgramBuilder } from "../../gl/ShaderProgramBuilder";
import { GameContext } from "../engine/GameContext";
import { AttributeType, Model } from "../engine/storage/Model";
import { Material } from "./Material";

// temp
export interface Light {
  pos: vec4,
  intensity: number,
  diffuse: vec4,
  ambient: vec4
}

export class MatteMaterial implements Material {
  private prog: WebGLProgram;
  private ctx: GameContext;
  vpMat: mat4;
  modelMat: mat4;
  color: vec4;
  light: {
    position: vec4,
    intensity: number,
    diffuse: vec4,
    ambient: vec4
  };

  private locs: {
    modelMat: WebGLUniformLocation,
    vpMat: WebGLUniformLocation,
    normalMat: WebGLUniformLocation,
    surfaceColor: WebGLUniformLocation,
    light: {
      pos: WebGLUniformLocation,
      intensity: WebGLUniformLocation,
      diff: WebGLUniformLocation,
      amb: WebGLUniformLocation
    }
  }

  private attribs: {
    pos: number,
    norm: number
  }
  
  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.prog = null;
    this.light = {
      position: vec4.create(),
      intensity: 0.0,
      diffuse: vec4.create(),
      ambient: vec4.create()
    };

    this.vpMat = mat4.create();
    this.modelMat = mat4.create();
    this.color = vec4.create();

    mat4.identity(this.vpMat);
    mat4.identity(this.modelMat);

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/matteshader/matteshader.vert")
      .withFragmentShader("../glsl/matteshader/matteshader.frag")
      .build()
      .then((prog) => {
        this.prog = prog;
        let gl = this.ctx.getGLContext();

        this.locs = {
          modelMat: gl.getUniformLocation(prog, "model_matrix"),
          vpMat: gl.getUniformLocation(prog, "vp_matrix"),
          normalMat: gl.getUniformLocation(prog, "normal_matrix"),
          surfaceColor: gl.getUniformLocation(prog, "surface_color"),
          light: {
            pos: gl.getUniformLocation(prog, "light.pos"),
            intensity: gl.getUniformLocation(prog, "light.intensity"),
            diff: gl.getUniformLocation(prog, "light.diffuse"),
            amb: gl.getUniformLocation(prog, "light.ambient")
          }
        };

        this.attribs = {
          pos: gl.getAttribLocation(prog, "position"),
          norm: gl.getAttribLocation(prog, "normal")
        }
      })
      .catch((err) => {
        console.error(err);
      })
  }

  // good TODO for here: create a debug camera that i can pilot around :3

  drawMaterial(model: Model) {
    let gl = this.ctx.getGLContext();
    if (this.prog !== null) {
      gl.useProgram(this.prog);
      let normalMat = mat3.create();
      mat3.fromMat4(normalMat, this.modelMat);
      mat3.invert(normalMat, normalMat);
      mat3.transpose(normalMat, normalMat);

      gl.uniformMatrix4fv(this.locs.modelMat, false, this.modelMat);
      gl.uniformMatrix4fv(this.locs.vpMat, false, this.vpMat);
      gl.uniformMatrix3fv(this.locs.normalMat, false, normalMat);
      gl.uniform4fv(this.locs.surfaceColor, this.color);
      gl.uniform4fv(this.locs.light.pos, this.light.position);
      gl.uniform1f(this.locs.light.intensity, this.light.intensity);
      gl.uniform4fv(this.locs.light.diff, this.light.diffuse);
      gl.uniform4fv(this.locs.light.amb, this.light.ambient);
      
      model.bindAttribute(AttributeType.POSITION, this.attribs.pos);
      model.bindAttribute(AttributeType.NORMAL, this.attribs.norm);

      model.draw();
    } else {
      console.log("wtf");
    }
  }
}