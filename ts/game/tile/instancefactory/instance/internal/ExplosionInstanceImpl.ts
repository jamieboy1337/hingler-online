import { mat4, vec3, vec4 } from "gl-matrix";
import { RenderContext } from "../../../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { ExplosionInstance } from "../ExplosionInstance";

export class ExplosionInstanceImpl extends ExplosionInstance {
  private callback : (i: ExplosionInstance, rc: RenderContext) => void;
  modelMat : mat4;
  threshold : number;
  color : vec4;
  noiseScale : vec3;
  noiseOffset: vec3;

  constructor(callback: (i: ExplosionInstance, rc: RenderContext) => void) {
    super();
    this.callback = callback; 
    this.modelMat = mat4.create();
    mat4.identity(this.modelMat);
    this.threshold = 0.0;
    this.color = vec4.create();
    this.noiseScale = vec3.create();
    this.noiseOffset = vec3.create();
  }

  draw(rc: RenderContext) {
    this.callback(this, rc);
  }
}