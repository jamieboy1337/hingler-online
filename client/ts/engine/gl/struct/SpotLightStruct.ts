import { mat4, vec3, vec4 } from "gl-matrix";
import { GameContext } from "../../GameContext";
import { SpotLight } from "../../object/game/light/SpotLight";
import { GLSLStruct } from "../GLSLStruct";
import { Texture } from "../Texture";
import { AttenuationStruct } from "./AttenuationStruct";

export class SpotLightStruct implements GLSLStruct {
  readonly position: vec3;
  readonly dir: vec3;
  readonly fov: number;
  readonly falloffRadius: number;
  readonly intensity: number;
  readonly color: vec4;
  readonly shadowTex: Texture;
  readonly lightTransform: mat4;

  readonly attenuation: AttenuationStruct;

  private index: number;

  private gl: WebGLRenderingContext;
  constructor(ctx: GameContext, light: SpotLight) {
    this.position = light.getPosition();
    this.dir = light.getDirectionVector();
    // convert back to rads for shader :)
    this.fov = light.fov * (Math.PI / 180);
    this.falloffRadius = light.falloffRadius;
    this.intensity = light.intensity;
    this.color = light.color;
    this.shadowTex = light.getShadowTexture();
    this.lightTransform = light.getLightMatrix();

    this.attenuation = new AttenuationStruct(ctx, light);

    this.index = 0;

    this.gl = ctx.getGLContext();
  }

  // this is fine :)
  // users will set it from render ctx
  // i think thats fine though
  setShadowTextureIndex(index: number) {
    if (index < 0 || index > 31) {
      const err = "Texture index out of bounds!";
      console.error(err);
      throw Error(err);
    }

    this.index = index;
  }

  bindToUniformByName(prog: WebGLProgram, name: string) {
    let gl = this.gl;
    
    const posLoc =        gl.getUniformLocation(prog, name + ".position");
    const dirLoc =        gl.getUniformLocation(prog, name + ".dir");
    const fovLoc =        gl.getUniformLocation(prog, name + ".fov");
    const falloffLoc =    gl.getUniformLocation(prog, name + ".falloffRadius");
    const intensityLoc =  gl.getUniformLocation(prog, name + ".intensity");
    const colorLoc =      gl.getUniformLocation(prog, name + ".color");
    const texLoc =        gl.getUniformLocation(prog, "texture_" + name);
    const transformLoc =  gl.getUniformLocation(prog, name + ".lightTransform");
    
    this.attenuation.bindToUniformByName(prog, name + ".a");

    gl.uniform3fv(posLoc, this.position);
    gl.uniform3fv(dirLoc, this.dir);
    gl.uniform1f(fovLoc, this.fov);
    gl.uniform1f(falloffLoc, this.falloffRadius);
    gl.uniform1f(intensityLoc, this.intensity);
    gl.uniform4fv(colorLoc, this.color);
    this.shadowTex.bindToUniform(texLoc, this.index);
    gl.uniformMatrix4fv(transformLoc, false, this.lightTransform);
  }
  
}