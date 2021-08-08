import { mat4 } from "gl-matrix";
import { RenderContext, RenderPass } from "../../render/RenderContext";
import { PBRInstance } from "../PBRInstance";

export const PBR_MODEL_MAT_INDEX = 4;

export class PBRInstanceImpl extends PBRInstance {
  private callback : (mat: mat4, rc: RenderContext) => void;
  modelMat : mat4;
  constructor(callback: (mat: mat4, rc: RenderContext) => void) {
    super();
    this.modelMat = mat4.create();
    mat4.identity(this.modelMat);
    this.callback = callback;
  }

  draw(rc: RenderContext) {
    this.callback(this.modelMat, rc);
  }
}