import { mat4, vec3 } from "gl-matrix";
import { GameContext } from "../../GameContext";
import { Camera, CameraInfo } from "./Camera";
import { GameObject } from "./GameObject";

// i think this is ok since circular references wont be a problem
// might have to factor
export class GameCamera extends GameObject implements Camera {
  // fov, in degrees.
  fov: number;
  private active: boolean;

  constructor(ctx: GameContext) {
    super(ctx);
    this.active = false;
    this.fov = 60;
  }

  getCameraMatrix() {
    let perspectiveMatrix = this.getPerspectiveMatrix();
    let viewMatrix = this.getViewMatrix();
    mat4.mul(viewMatrix, perspectiveMatrix, viewMatrix);
    return viewMatrix;
  }

  getCameraInfo() : CameraInfo {
    let pos = vec3.create();
    vec3.zero(pos);
    let mat = this.getTransformationMatrix();
    vec3.transformMat4(pos, pos, mat);
    let res = {
      viewMatrix: this.getViewMatrix(),
      perspectiveMatrix: this.getPerspectiveMatrix(),
      vpMatrix: mat4.create(),
      cameraPosition: this.getPosition()
    }

    mat4.mul(res.vpMatrix, res.perspectiveMatrix, res.viewMatrix);
    return res;
  }

  getViewMatrix() {
    let vm = this.getTransformationMatrix();
    mat4.invert(vm, vm);
    return vm;
  }

  getPerspectiveMatrix() {
    let dims = this.getContext().getScreenDims();
    let aspectRatio = dims[0] / dims[1];
    let pm = mat4.create();
    mat4.perspective(pm, this.fov * (Math.PI / 180.0), aspectRatio, 0.01, 100);
    return pm;
  }

  // todo2: set active camera?
  setAsActive() {
    // contract: only one active camera at a time
    let cur : GameObject = this;
    let parent = cur.getParent();
    while (parent !== null) {
      cur = parent;
      parent = cur.getParent();
    }

    this.findActiveCameraAndDeactivate(cur);
    // no cameras are active now, set this one as active
    this.active = true;    
  }

  isActive() : boolean {
    return this.active;
  }

  private deactivateCamera() {
    this.active = false;
  }

  private findActiveCameraAndDeactivate(root: GameObject) {
    if (root instanceof GameCamera) {
      let cam = root as GameCamera;
      if (cam.active) {
        cam.deactivateCamera();
        return;
      }
    }

    for (let child of root.getChildren()) {
      this.findActiveCameraAndDeactivate(child);
    }
  }
}