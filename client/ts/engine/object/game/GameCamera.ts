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
    let res = {
      viewMatrix: this.getViewMatrix(),
      perspectiveMatrix: this.getPerspectiveMatrix(),
      vpMatrix: mat4.create()
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

  lookAt(x: number | vec3, y: number, z: number) {
    // this is a bit of a pain in the ass
    // we need to alter rotation to aim towards a preset vector
    // x is theta, y is phi if we're working in euler
    let dirVector : vec3 = (typeof x === "number" ? vec3.fromValues(x, y, z) : x);
    let pos = this.getPosition();
    // account for own offset: vector from camera to dest
    vec3.sub(dirVector, dirVector, pos);
    console.log(dirVector);
    let dir = vec3.create();
    vec3.normalize(dir, dirVector);
    let theta = Math.PI + Math.atan2(dir[0], dir[2]);
    let phi : number;
    let phi_denom = Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]);
    if (phi_denom === 0 || phi_denom === NaN) {
      phi = 0;
    } else {
      phi = Math.atan(dir[1] / phi_denom);
    }
    // kinda shit
    console.log(`${theta}, ${phi}`);
    this.setRotationEuler(phi * (180 / Math.PI), theta * (180 / Math.PI), 0);
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