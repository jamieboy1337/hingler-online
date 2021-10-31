import { mat4, vec4 } from "gl-matrix";
import { RenderContext } from "../../../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { PowerupInstance } from "../PowerupInstance";

export class PowerupInstanceImpl extends PowerupInstance {
  private callback : (i: PowerupInstanceImpl, rc: RenderContext) => void;
  modelMat: mat4;
  color: vec4;

  constructor(callback: (i: PowerupInstanceImpl, rc: RenderContext) => void) {
    super();
    this.callback = callback;
    this.modelMat = mat4.create();
    mat4.identity(this.modelMat);
    this.color = vec4.create();
    vec4.zero(this.color);
  }

  draw(rc: RenderContext) {
    this.callback(this, rc);
  }
}