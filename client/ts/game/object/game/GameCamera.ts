import { mat4 } from "gl-matrix";
import { GameContext } from "../../engine/GameContext";
import { GameObject } from "./GameObject";

export class GameCamera extends GameObject {
  // fov, in degrees.
  fov: number;

  constructor(ctx: GameContext) {
    super(ctx);
  }

  getViewMatrix() {
    let dims = this.getContext().getScreenDims();
    let aspectRatio = dims[0] / dims[1];
    let perspectiveMatrix = mat4.create();
    // TODO: devise a better way to set clipping planes
    mat4.perspective(perspectiveMatrix, this.fov, aspectRatio, 0.01, 100);
    let viewMatrix = this.getTransformationMatrix();
    mat4.invert(viewMatrix, viewMatrix);
    mat4.mul(viewMatrix, perspectiveMatrix, viewMatrix);
    return viewMatrix;
  }

  // todo2: set active camera?
}