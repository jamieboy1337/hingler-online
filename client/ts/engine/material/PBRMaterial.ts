import { mat4, vec3, vec4 } from "gl-matrix";
import { SpotLightStruct } from "../gl/struct/SpotLightStruct";
import { Texture } from "../gl/Texture";
import { Model } from "../model/Model";
import { Material } from "./Material";
import { PBRInterface } from "./PBRInterface";

// TODO: this is basically copy pasted bc I need a lot of these uniforms again
// come up with a way to factor that reuse out
export interface PBRMaterial extends Material, PBRInterface { 
  
  vpMat: mat4;
  modelMat: mat4;
  
  color: Texture;
  colorFactor: vec4;
  normal: Texture;
  metalRough: Texture;
  metalFactor: number;
  roughFactor: number;

  cameraPos: vec3;

  setSpotLight(light: Array<SpotLightStruct>) : void;

  drawMaterial(model: Model) : void;
}