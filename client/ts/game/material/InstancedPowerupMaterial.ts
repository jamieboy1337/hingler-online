// a: modelmat (64)
// b: normmat (36)
// c: color (16)

import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { GLBufferImpl } from "../../../../hingler-party/client/ts/engine/gl/internal/GLBufferImpl";
import { ShaderProgramBuilder } from "../../../../hingler-party/client/ts/engine/gl/ShaderProgramBuilder";
import { InstancedModelImpl } from "../../../../hingler-party/client/ts/engine/loaders/internal/InstancedModelImpl";
import { CalculateNormalMatrixFromBuffer } from "../../../../hingler-party/client/ts/engine/material/CalculateNormalMatrixFromBuffer";
import { InstancedMaterial } from "../../../../hingler-party/client/ts/engine/material/InstancedMaterial";
import { AttributeType } from "nekogirl-valhalla/model";
import { RenderContext } from "../../../../hingler-party/client/ts/engine/render/RenderContext";

export class InstancedPowerupMaterial implements InstancedMaterial {
  private ctx: GameContext;
  private prog: WebGLProgram;
  
  private attribs: {
    aPosition: number,
    aNormal: number,
    aColor: number,
    aModelMat: number,
    aNormalMat: number
  };

  private uniforms: {
    vpMat: WebGLUniformLocation,
    camPos: WebGLUniformLocation
  };

  private normBuffer: GLBufferImpl;

  modelMatrixIndex: number;
  colorIndex: number;

  constructor(ctx: GameContext) {
    this.prog = null;

    this.ctx = ctx;

    this.normBuffer = new GLBufferImpl(this.ctx);

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/powerup/powerup.vert")
      .withFragmentShader("../glsl/game/powerup/powerup.frag")
      .build()
      .then(this.configureProgram.bind(this));
  }

  private configureProgram(prog: WebGLProgram) {
    let gl = this.ctx.getGLContext();
    this.prog = prog;

    this.attribs = {
      aPosition: gl.getAttribLocation(prog, "aPosition"),
      aNormal: gl.getAttribLocation(prog, "aNormal"),
      aColor: gl.getAttribLocation(prog, "aColor"),
      aModelMat: gl.getAttribLocation(prog, "aModelMat"),
      aNormalMat: gl.getAttribLocation(prog, "aNormalMat")
    };

    this.uniforms = {
      vpMat: gl.getUniformLocation(prog, "vpMat"),
      camPos: gl.getUniformLocation(prog, "camPos")
    };
  }

  prepareAttributes(model: InstancedModelImpl, instances: number, rc: RenderContext) {
    let gl = this.ctx.getGLContext();
    if (this.prog !== null) {
      const ctx = this.ctx.getGL();
      ctx.useProgram(this.prog);

      let info = rc.getActiveCameraInfo();

      gl.uniformMatrix4fv(this.uniforms.vpMat, false, info.vpMatrix);
      gl.uniform3fv(this.uniforms.camPos, info.cameraPosition);

      model.bindAttribute(AttributeType.POSITION, this.attribs.aPosition);
      model.bindAttribute(AttributeType.NORMAL, this.attribs.aNormal);

      let modelMat = model.getReadOnlyBuffer(this.modelMatrixIndex);

      CalculateNormalMatrixFromBuffer(modelMat, this.normBuffer, instances, 0, 0);

      // calculate normals
      for (let i = 0; i < 4; i++) {
        const loc = this.attribs.aModelMat + i;
        const byteOffset = i * 16;
        model.instanceAttribPointer(this.modelMatrixIndex, loc, 4, gl.FLOAT, false, 64, byteOffset);
      }

      for (let i = 0; i < 3; i++) {
        const loc = this.attribs.aNormalMat + i;
        const byteOffset = i * 12;
        this.normBuffer.bindToInstancedVertexAttribute(loc, 3, gl.FLOAT, false, 36, byteOffset);
      }

      model.instanceAttribPointer(this.colorIndex, this.attribs.aColor, 4, gl.FLOAT, false, 0, 0);
    }
  }

  cleanUpAttributes() {
    for (let i = 0; i < 3; i++) {
      this.normBuffer.disableInstancedVertexAttribute(this.attribs.aNormalMat + i);
    }
  }
}