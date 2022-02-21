import { mat4, ReadonlyMat4 } from "gl-matrix";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { ColorCubemap } from "../../../../../hingler-party/client/ts/engine/gl/ColorCubemap";
import { GLProgramWrap } from "../../../../../hingler-party/client/ts/engine/gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../../../../../hingler-party/client/ts/engine/gl/ShaderProgramBuilder";
import { AmbientLightStruct } from "../../../../../hingler-party/client/ts/engine/gl/struct/AmbientLightStruct";
import { SpotLightStruct } from "../../../../../hingler-party/client/ts/engine/gl/struct/SpotLightStruct";
import { InstancedMaterial } from "../../../../../hingler-party/client/ts/engine/material/InstancedMaterial";
import { TextureDummy } from "../../../../../hingler-party/client/ts/engine/material/TextureDummy";
import { InstancedModel } from "../../../../../hingler-party/client/ts/engine/model/InstancedModel";
import { AttributeType } from "nekogirl-valhalla/model";
import { RenderContext, SkyboxInfo } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";

export class InstancedGrassMaterial implements InstancedMaterial {
  private ctx: GameContext;

  modelMatrixChildIndex: number;
  normalMatrixChildIndex: number;

  private prog: WebGLProgram;
  private wrap: GLProgramWrap;

  private unifs: {
    modelMatParent: WebGLUniformLocation,
    vpMat: WebGLUniformLocation,
    spotlightCount: WebGLUniformLocation,
    spotlightCount_noShadow: WebGLUniformLocation,
    camPos: WebGLUniformLocation,
    skyboxDiffuse: Array<WebGLUniformLocation>,
    skyboxDiffuseIntensity: Array<WebGLUniformLocation>
  };

  private locs: {
    aPosition: number,
    aNormal: number,
    modelMatChild: number,
    normalMatChild: number
  };

  private placeholderDiffuse: Array<ColorCubemap>;
  private shadowDummy: Array<TextureDummy>;

  modelMatParent: ReadonlyMat4;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.modelMatrixChildIndex = -1;
    this.normalMatrixChildIndex = -1;

    this.prog = null;
  
    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/grass/grass.vert")
      .withFragmentShader("../glsl/game/grass/grass.frag")
      .build()
      .then(this.configureProgram.bind(this));

    this.placeholderDiffuse = [];
    this.shadowDummy = [];
    for (let i = 0; i < 2; i++) {
      this.placeholderDiffuse.push(new ColorCubemap(ctx, 1));
      // this.shadowDummy.push(new TextureDummy(ctx));
    }
  }

  private configureProgram(prog: WebGLProgram) {
    const gl = this.ctx.getGLContext();
    this.prog = prog;
    this.wrap = new GLProgramWrap(gl, this.prog);
    this.unifs = {
      modelMatParent: gl.getUniformLocation(prog, "modelMatParent"),
      vpMat: gl.getUniformLocation(prog, "vpMat"),
      spotlightCount: gl.getUniformLocation(prog, "spotlightCount"),
      spotlightCount_noShadow: gl.getUniformLocation(prog, "spotlightCount_noShadow"),
      camPos: gl.getUniformLocation(prog, "camPos"),
      skyboxDiffuse: [],
      skyboxDiffuseIntensity: []
    };

    for (let i = 0; i < 2; i++) {
      this.unifs.skyboxDiffuse.push(gl.getUniformLocation(prog, `skyboxDiffuse[${i}]`));
      this.unifs.skyboxDiffuseIntensity.push(gl.getUniformLocation(prog, `skyboxDiffuseIntensity[${i}]`));
    }

    this.locs = {
      aPosition: gl.getAttribLocation(prog, "aPosition"),
      aNormal: gl.getAttribLocation(prog, "aNormal"),
      modelMatChild: gl.getAttribLocation(prog, "modelMatChild"),
      normalMatChild: gl.getAttribLocation(prog, "normalMatChild")
    };
  }

  prepareAttributes(model: InstancedModel, instances: number, rc: RenderContext) {
    if (this.modelMatrixChildIndex < 0 || this.normalMatrixChildIndex < 0) {
      const err = "Model mat locations unbound -- cannot draw";
      throw Error(err);
    }
    if (this.prog !== null) {
      const gl = this.ctx.getGLContext();
      const sky = rc.getSkybox();
      const cam = rc.getActiveCameraInfo();
      const amb = rc.getAmbientLightInfo();
      const spot = rc.getSpotLightInfo();

      const wrap = this.ctx.getGL();
      wrap.useProgram(this.prog);

      gl.uniformMatrix4fv(this.unifs.modelMatParent, false, this.modelMatParent);
      gl.uniformMatrix4fv(this.unifs.vpMat, false, cam.vpMatrix);
      
      let spotCount = 0;
      let noShadowSpotCount = 0;
      for (let light of spot) {
        if (spotCount < 4 && light.hasShadow()) {
          light.setShadowTextureIndex(spotCount + 4);
          light.bindToUniformByName(this.wrap, `spotlight[${spotCount++}]`, true);
        } else if (noShadowSpotCount < 4) {
          light.bindToUniformByName(this.wrap, `spotlight_noShadow[${noShadowSpotCount++}]`, false);
        }
      }

      wrap.uniform1i(this.unifs.spotlightCount, spotCount);
      wrap.uniform1i(this.unifs.spotlightCount_noShadow, noShadowSpotCount);

      gl.uniform3fv(this.unifs.camPos, cam.cameraPosition);

      const diffuseArray = [
        (sky !== null && sky.length > 0 ? sky[0].irridance : this.placeholderDiffuse[0]),
        (sky !== null && sky.length > 1 ? sky[1].irridance : this.placeholderDiffuse[1])
      ];

      const intensityArray = [
        (sky !== null && sky.length > 0 ? sky[0].intensity : 0),
        (sky !== null && sky.length > 1 ? sky[1].intensity : 0)
      ];

      diffuseArray[0].bindToUniform(this.unifs.skyboxDiffuse[0], 8);
      diffuseArray[1].bindToUniform(this.unifs.skyboxDiffuse[1], 9);

      wrap.uniform1f(this.unifs.skyboxDiffuseIntensity[0], intensityArray[0]);
      wrap.uniform1f(this.unifs.skyboxDiffuseIntensity[1], intensityArray[1]);

      model.bindAttribute(AttributeType.POSITION, this.locs.aPosition);
      model.bindAttribute(AttributeType.NORMAL, this.locs.aNormal);

      for (let i = 0; i < 4; i++) {
        const loc = this.locs.modelMatChild + i;
        const byteOffset = i * 16;
        model.instanceAttribPointer(this.modelMatrixChildIndex, loc, 4, gl.FLOAT, false, 64, byteOffset);
      }

      for (let i = 0; i < 3; i++) {
        const loc = this.locs.normalMatChild + i;
        const byteOffset = i * 12;
        model.instanceAttribPointer(this.normalMatrixChildIndex, loc, 3, gl.FLOAT, false, 36, byteOffset);
      }
    }
  }

  cleanUpAttributes() {
    // nop -- everything in model
  }
}