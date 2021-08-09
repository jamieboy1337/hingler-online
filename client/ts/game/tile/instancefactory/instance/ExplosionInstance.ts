import { mat4, vec3, vec4 } from "gl-matrix";
import { ModelInstance } from "../../../../engine/model/ModelInstance";

export abstract class ExplosionInstance extends ModelInstance {
  abstract modelMat : mat4;
  abstract threshold : number;
  abstract color : vec4;
  abstract noiseScale : vec3;
  abstract noiseOffset: vec3;
};