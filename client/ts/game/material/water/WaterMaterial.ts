import { mat4, ReadonlyMat4, ReadonlyVec3, vec3 } from "gl-matrix";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { ColorCubemap } from "../../../../../hingler-party/client/ts/engine/gl/ColorCubemap";
import { Cubemap } from "../../../../../hingler-party/client/ts/engine/gl/Cubemap";
import { GLProgramWrap } from "../../../../../hingler-party/client/ts/engine/gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../../../../../hingler-party/client/ts/engine/gl/ShaderProgramBuilder";
import { SpotLightStruct } from "../../../../../hingler-party/client/ts/engine/gl/struct/SpotLightStruct";
import { Texture } from "../../../../../hingler-party/client/ts/engine/gl/Texture";
import { Material } from "../../../../../hingler-party/client/ts/engine/material/Material";
import { TextureDummy } from "../../../../../hingler-party/client/ts/engine/material/TextureDummy";
import { Model, AttributeType } from "../../../../../hingler-party/client/ts/engine/model/Model";
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
    cubemapDiffuse: WebGLUniformLocation;
    cubemapSpec: WebGLUniformLocation;
    texBRDF: WebGLUniformLocation;
    skyboxIntensity: WebGLUniformLocation;
    specRes: WebGLUniformLocation;
    useSkybox: WebGLUniformLocation;
  };

  lights: Array<SpotLightStruct>;

  time: number;
  modelMat: ReadonlyMat4;
  vpMat: ReadonlyMat4;
  waves: Array<WaveStruct>;
  camerapos: ReadonlyVec3;

  cubemapDiffuse: Cubemap;
  cubemapSpec: Cubemap;
  texBRDF: Texture;
  skyboxIntensity: number;

  private placeholderDiffuse: Cubemap;
  private placeholderSpec: Cubemap;
  private placeholderTex: TextureDummy;

  constructor(ctx: GameContext) {
    this.prog = null;

    this.ctx = ctx;
    
    this.time = 0;
    this.modelMat = mat4.create();
    this.vpMat = mat4.create();
    this.waves = [];
    this.lights = [];
    this.camerapos = vec3.create();

    this.cubemapDiffuse = null;
    this.cubemapSpec = null;
    this.texBRDF = null;

    this.skyboxIntensity = 1.0;

    this.placeholderDiffuse = new ColorCubemap(ctx, 8);
    this.placeholderSpec = new ColorCubemap(ctx, 8);
    this.placeholderTex = new TextureDummy(ctx);
    
    this.ctx.getGLExtension("EXT_shader_texture_lod");

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
      gradientStops: [],
      cubemapDiffuse: gl.getUniformLocation(this.prog, "cubemapDiffuse"),
      cubemapSpec: gl.getUniformLocation(this.prog, "cubemapSpec"),
      texBRDF: gl.getUniformLocation(this.prog, "texBRDF"),
      skyboxIntensity: gl.getUniformLocation(this.prog, "skyboxIntensity"),
      specRes: gl.getUniformLocation(this.prog, "specRes"),
      useSkybox: gl.getUniformLocation(this.prog, "useSkybox")
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
          light.setShadowTextureIndex(shadowCount + 4);
          light.bindToUniformByName(this.progWrap, `spotlight[${shadowCount}]`, true);
          shadowCount++;
        } else if (noShadowCount < 4) {
          // forgot to create config for forgetting shadow :(
          light.bindToUniformByName(this.progWrap, `spotlight_no_shadow[${noShadowCount}]`);
          noShadowCount++;
        }
      }

      gl.uniform1i(this.locs.spotCount, shadowCount);
      gl.uniform1i(this.locs.noSpotCount, noShadowCount);
      gl.uniform1i(this.locs.ambientCount, 0);
      gl.uniform3fv(this.locs.camera_pos, this.camerapos);

      if (this.cubemapDiffuse !== null && this.cubemapSpec !== null && this.texBRDF !== null) {
        this.cubemapDiffuse.bindToUniform(this.locs.cubemapDiffuse, 8);
        this.cubemapSpec.bindToUniform(this.locs.cubemapSpec, 9);
        this.texBRDF.bindToUniform(this.locs.texBRDF, 10);
        gl.uniform1f(this.locs.specRes, this.cubemapSpec.dims);
        gl.uniform1f(this.locs.skyboxIntensity, this.skyboxIntensity);
        gl.uniform1i(this.locs.useSkybox, 1);
      } else {
        this.placeholderDiffuse.bindToUniform(this.locs.cubemapDiffuse, 8);
        this.placeholderSpec.bindToUniform(this.locs.cubemapSpec, 9);
        this.placeholderTex.bindToUniform(this.locs.texBRDF, 10);
        gl.uniform1f(this.locs.specRes, 1.0);
        gl.uniform1f(this.locs.skyboxIntensity, this.skyboxIntensity);
        gl.uniform1i(this.locs.useSkybox, 0);
      }

      // tba: lights!
      model.bindAttribute(AttributeType.POSITION, this.attribs.pos);

      model.draw();
    }
  }
}