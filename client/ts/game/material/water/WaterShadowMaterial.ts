import { mat4, ReadonlyMat4 } from "gl-matrix";
import { GameContext } from "../../../engine/GameContext";
import { GLProgramWrap } from "../../../engine/gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../../../engine/gl/ShaderProgramBuilder";
import { Material } from "../../../engine/material/Material";
import { AttributeType, Model } from "../../../engine/model/Model";
import { WaveStruct } from "../../struct/WaveStruct";

export class WaterShadowMaterial implements Material {
  private progWrap: GLProgramWrap;
  private prog: WebGLProgram;
  private ctx: GameContext;

  private attribs: {
    pos: number;
  };

  private locs: {
    modelMatrix: WebGLUniformLocation;
    vpMatrix: WebGLUniformLocation;
    time: WebGLUniformLocation;
    wavecount: WebGLUniformLocation;
  };

  time: number;
  modelMat: ReadonlyMat4;
  vpMat: ReadonlyMat4;
  waves: Array<WaveStruct>;

  constructor(ctx: GameContext) {
    this.prog = null;
    this.ctx = ctx;
    
    this.time = 0;
    this.modelMat = mat4.create();
    this.vpMat = mat4.create();
    this.waves = [];
    
    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/water/watershadow.vert")
      .withFragmentShader("../glsl/game/water/watershadow.frag")
      .build()
      .then(this.prepareMaterial.bind(this));
  }

  private prepareMaterial(res: WebGLProgram) {
    let gl = this.ctx.getGLContext();
    this.prog = res;
    this.progWrap = new GLProgramWrap(this.ctx.getGLContext(), this.prog);

    this.attribs = {
      pos: gl.getAttribLocation(this.prog, "position")
    };

    this.locs = {
      modelMatrix: gl.getUniformLocation(this.prog, "modelMatrix"),
      vpMatrix: gl.getUniformLocation(this.prog, "vpMatrix"),
      time: gl.getUniformLocation(this.prog, "time"),
      wavecount: gl.getUniformLocation(this.prog, "wavecount")
    };
  }

  drawMaterial(model: Model) {
    if (this.prog !== null) {
      const gl = this.ctx.getGLContext();
      gl.useProgram(this.prog);

      gl.uniformMatrix4fv(this.locs.modelMatrix, false, this.modelMat);
      gl.uniformMatrix4fv(this.locs.vpMatrix, false, this.vpMat);
      gl.uniform1f(this.locs.time, this.time);

      for (let i = 0; i < this.waves.length && i < 4; i++) {
        const wave = this.waves[i];
        wave.bindToUniformByName(this.progWrap, `wavelist[${i}]`);
      }

      gl.uniform1i(this.locs.wavecount, Math.min(this.waves.length, 4));

      model.bindAttribute(AttributeType.POSITION, this.attribs.pos);
      model.draw();
    }
  }
}