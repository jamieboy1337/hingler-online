// todo: replace instances of WebGLProgram with a version which keeps track of uniform locations

import { mat3, mat4, vec3, vec4 } from "gl-matrix";
import { GameContext } from "../GameContext";
import { GLProgramWrap } from "../gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../gl/ShaderProgramBuilder";
import { SpotLightStruct } from "../gl/struct/SpotLightStruct";
import { Texture } from "../gl/Texture";
import { AttributeType, Model } from "../storage/Model";
import { Material } from "./Material";
import { TextureDummy } from "./TextureDummy";

// so that instead of calling gl.getUniformLocation we can look it up from a cache
export class PBRMaterial implements Material {
  private progWrap: GLProgramWrap;
  private prog: WebGLProgram;
  private ctx: GameContext;
  private spot: Array<SpotLightStruct>;
  private placeholder: TextureDummy;
  
  vpMat: mat4;
  modelMat: mat4;
  
  color: Texture;
  colorFactor: vec4;
  normal: Texture;
  metalRough: Texture;
  metalFactor: number;
  roughFactor: number;

  cameraPos: vec3;

  private locs: {
    modelMat: WebGLUniformLocation,
    vpMat: WebGLUniformLocation,
    normalMat: WebGLUniformLocation,
    lightCount: WebGLUniformLocation,
    lightCountNoShadow: WebGLUniformLocation,
    cameraPos: WebGLUniformLocation,

    texAlbedo: WebGLUniformLocation,
    texNorm: WebGLUniformLocation,
    texMetalRough: WebGLUniformLocation,

    useAlbedo: WebGLUniformLocation,
    useNorm: WebGLUniformLocation,
    useRough: WebGLUniformLocation,

    albedoDef: WebGLUniformLocation,
    roughDef: WebGLUniformLocation,
    metalDef: WebGLUniformLocation
  };

  private attribs: {
    pos: number,
    norm: number,
    tex: number,
    tan: number
  };

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.prog = null;

    this.placeholder = new TextureDummy(ctx);

    this.vpMat = mat4.create();
    this.modelMat = mat4.create();
    this.normal = null;
    this.color = null;
    this.colorFactor = vec4.create();
    this.metalRough = null;
    this.metalFactor = 1.0;
    this.roughFactor = 1.0;
    this.cameraPos = vec3.create();

    mat4.identity(this.vpMat);
    mat4.identity(this.modelMat);

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/pbr/pbr.vert")
      .withFragmentShader("../glsl/pbr/pbr.frag")
      .build()
      .then(this.configureProgram.bind(this))
      .catch(console.error.bind(console));
  }

  private configureProgram(prog: WebGLProgram) {
    this.prog = prog;
    let gl = this.ctx.getGLContext();

    this.locs = {
      modelMat: gl.getUniformLocation(prog, "model_matrix"),
      vpMat: gl.getUniformLocation(prog, "vp_matrix"),
      normalMat: gl.getUniformLocation(prog, "normal_matrix"),
      lightCount: gl.getUniformLocation(prog, "spotlightCount"),
      lightCountNoShadow: gl.getUniformLocation(prog, "spotlightCount_no_shadow"),
      cameraPos: gl.getUniformLocation(prog, "camera_pos"),
      texAlbedo: gl.getUniformLocation(prog, "tex_albedo"),
      texNorm: gl.getUniformLocation(prog, "tex_norm"),
      texMetalRough: gl.getUniformLocation(prog, "tex_metal_rough"),
      useAlbedo: gl.getUniformLocation(prog, "use_albedo"),
      useNorm: gl.getUniformLocation(prog, "use_norm"),
      useRough: gl.getUniformLocation(prog, "use_metal_rough"),
      albedoDef: gl.getUniformLocation(prog, "color_factor"),
      roughDef: gl.getUniformLocation(prog, "rough_factor"),
      metalDef: gl.getUniformLocation(prog, "metal_factor")
    };

    this.attribs = {
      pos: gl.getAttribLocation(prog, "position"),
      norm: gl.getAttribLocation(prog, "normal"),
      tex: gl.getAttribLocation(prog, "texcoord"),
      tan: gl.getAttribLocation(prog, "tangent")
    };

    this.progWrap = new GLProgramWrap(gl, this.prog);
  }

  setSpotLight(light: Array<SpotLightStruct>) {
    this.spot = light;
  }

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

      let shadowSpot = 0;
      let noShadowSpot = 0;
      if (this.spot) {
        for (let i = 0; i < this.spot.length; i++) {
          this.spot[i].setShadowTextureIndex(i + 16);
          if (this.spot[i].hasShadow() && shadowSpot < 4) {
            this.spot[i].bindToUniformByName(this.progWrap, `spotlight[${i}]`, true);
            shadowSpot++;
          } else {
            this.spot[i].bindToUniformByName(this.progWrap, `spotlight_no_shadow[${i}]`, false);
            noShadowSpot++;
          }
        }
      }

      gl.uniform1i(this.locs.lightCount, shadowSpot);
      gl.uniform1i(this.locs.lightCountNoShadow, noShadowSpot);
      gl.uniform3fv(this.locs.cameraPos, this.cameraPos);

      if (this.color === null) {
        this.placeholder.bindToUniform(this.locs.texAlbedo, 0);
        gl.uniform1i(this.locs.useAlbedo, 0);
      } else {  // this.color instanceof Texture*
        this.color.bindToUniform(this.locs.texAlbedo, 0);
        gl.uniform1i(this.locs.useAlbedo, 1);
      }
      
      gl.uniform4fv(this.locs.albedoDef, this.colorFactor);

      if (this.normal === null) {
        this.placeholder.bindToUniform(this.locs.texNorm, 1);
        gl.uniform1i(this.locs.useNorm, 0);
      } else {
        this.normal.bindToUniform(this.locs.texNorm, 1);
        gl.uniform1i(this.locs.useNorm, 1);
      }

      if (this.metalRough === null) {
        this.placeholder.bindToUniform(this.locs.texMetalRough, 2);
        gl.uniform1i(this.locs.useRough, 0);
      } else {
        this.metalRough.bindToUniform(this.locs.texMetalRough, 2);
        gl.uniform1i(this.locs.useRough, 1);
      }
      
      gl.uniform1f(this.locs.roughDef, this.roughFactor);
      gl.uniform1f(this.locs.metalDef, this.metalFactor);

      model.bindAttribute(AttributeType.POSITION, this.attribs.pos);
      model.bindAttribute(AttributeType.NORMAL, this.attribs.norm);
      model.bindAttribute(AttributeType.TEXCOORD, this.attribs.tex);
      model.bindAttribute(AttributeType.TANGENT, this.attribs.tan);

      model.draw();
    }
  }
}