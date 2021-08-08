import { mat4 } from "gl-matrix";
import { ModelInstance } from "./ModelInstance";

export abstract class PBRInstance extends ModelInstance {
  // update on set
  abstract modelMat : mat4;
}