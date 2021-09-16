import { ReadonlyMat4, vec4 } from "gl-matrix";
import { ModelInstance } from "../../../../engine/model/ModelInstance";

export abstract class PowerupInstance extends ModelInstance {
  abstract modelMat: ReadonlyMat4;
  abstract color: vec4;
}