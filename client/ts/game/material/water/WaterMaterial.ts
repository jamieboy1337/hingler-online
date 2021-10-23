import { mat4, ReadonlyMat4, ReadonlyVec3, vec3 } from "gl-matrix";
import { GameContext } from "../../../engine/GameContext";
import { GLProgramWrap } from "../../../engine/gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../../../engine/gl/ShaderProgramBuilder";
import { SpotLightStruct } from "../../../engine/gl/struct/SpotLightStruct";
import { Material } from "../../../engine/material/Material";
import { AttributeType, Model } from "../../../engine/model/Model";
import { WaveStruct } from "../../struct/WaveStruct";

const GRADIENT_COLORS = [
  [0.001972, 0.009402, 0.011653, 1.0],
  [0.016985, 0.176431, 0.251472, 1.0],
  [0.022222, 0.343843, 0.384827, 1.0],
  [0.418372, 0.831092, 1.0, 1.0]
];

const GRADIENT_STOPS = [0.0, 0.213637, 0.484091, 0.790909];

export class WaterMaterial implements Material {
  private progWrap: GLProgramWrap;
  private prog: WebGLProgram;
  private ctx: GameContext;

  private attribs : {
    pos: number;
  };

  private locs : {
    modelMatrix: WebGLUniformLocation;
    vpMatrix: WebGLUniformLocation;
    time: WebGLUniformLocation;
    wavecount: WebGLUniformLocation;
    spotCount: WebGLUniformLocation;
    noSpotCount: WebGLUniformLocation;
    ambientCount: WebGLUniformLocation;
    camera_pos: WebGLUniformLocation;
    gradientCols: Array<WebGLUniformLocation>;
    gradientStops: Array<WebGLUniformLocation>;
  };

  lights: Array<SpotLightStruct>;

  time: number;
  modelMat: ReadonlyMat4;
  vpMat: ReadonlyMat4;
  waves: Array<WaveStruct>;
  camerapos: ReadonlyVec3;

  constructor(ctx: GameContext) {
    this.prog = null;

    this.ctx = ctx;
    
    this.time = 0;
    this.modelMat = mat4.create();
    this.vpMat = mat4.create();
    this.waves = [];
    this.lights = [];
    this.camerapos = vec3.create();

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/water/water.vert")
      .withFragmentShader("../glsl/game/water/water.frag")
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
      wavecount: gl.getUniformLocation(this.prog, "wavecount"),
      spotCount: gl.getUniformLocation(this.prog, "spotlightCount"),
      noSpotCount: gl.getUniformLocation(this.prog, "spotlightCount_no_shadow"),
      ambientCount: gl.getUniformLocation(this.prog, "ambientCount"),
      camera_pos: gl.getUniformLocation(this.prog, "camera_pos"),
      gradientCols: [],
      gradientStops: []
    };

    for (let i = 0; i < 4; i++) {
      this.locs.gradientCols.push(gl.getUniformLocation(this.prog, `gradientCols[${i}]`));
      this.locs.gradientStops.push(gl.getUniformLocation(this.prog, `gradientStops[${i}]`));
    }
  }

  drawMaterial(model: Model) {
    if (this.prog !== null) {
      let gl = this.ctx.getGLContext();
      gl.useProgram(this.prog);

      gl.uniformMatrix4fv(this.locs.modelMatrix, false, this.modelMat);
      gl.uniformMatrix4fv(this.locs.vpMatrix, false, this.vpMat);
      gl.uniform1f(this.locs.time, this.time);

      for (let i = 0; i < 4; i++) {
        gl.uniform4fv(this.locs.gradientCols[i], GRADIENT_COLORS[i]);
        gl.uniform1f(this.locs.gradientStops[i], GRADIENT_STOPS[i]);
      }

      for (let i = 0; i < this.waves.length; i++) {
        const wave = this.waves[i];
        wave.bindToUniformByName(this.progWrap, `wavelist[${i}]`);
      }

      gl.uniform1i(this.locs.wavecount, Math.min(this.waves.length, 4));

      let shadowCount = 0;
      let noShadowCount = 0;

      for (let light of this.lights) {
        if (light.hasShadow() && shadowCount < 3) {
          light.setShadowTextureIndex(shadowCount + 3);
          light.bindToUniformByName(this.progWrap, `spotlight[${shadowCount}]`);
          shadowCount++;
        } else if (noShadowCount < 4) {
          light.bindToUniformByName(this.progWrap, `spotlight_no_shadow[${noShadowCount}]`);
          noShadowCount++;
        }
      }

      gl.uniform1i(this.locs.spotCount, shadowCount);
      gl.uniform1i(this.locs.noSpotCount, noShadowCount);
      gl.uniform1i(this.locs.ambientCount, 0);
      gl.uniform3fv(this.locs.camera_pos, this.camerapos);

      // tba: lights!
      model.bindAttribute(AttributeType.POSITION, this.attribs.pos);

      model.draw();
    }
  }
}