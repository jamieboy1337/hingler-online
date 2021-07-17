import { mat4 } from "gl-matrix";
import { perf } from "../../../../../ts/performance";
import { CameraInfo } from "../../object/game/Camera";
import { GameCamera } from "../../object/game/GameCamera";
import { GameObject } from "../../object/game/GameObject";
import { Scene } from "../../object/scene/Scene";
import { RenderContext, RenderPass } from "../../render/RenderContext";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";
import { GLTFLoaderImpl } from "../loaders/internal/GLTFLoaderImpl";

/**
 * INTERNAL ONLY.
 */
export class EngineContext implements GameContext {
  private lastTimePoint: number;
  private lastDelta: number;
  private loader: FileLoader;
  private gltfLoader: GLTFLoaderImpl;
  private glContext: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private scene: Scene;


  constructor(canvas: HTMLCanvasElement, scene?: Scene) {
    this.lastDelta = 0;
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    this.canvas = canvas;
    this.glContext = canvas.getContext("webgl");
    this.gltfLoader = new GLTFLoaderImpl(this.loader, this.glContext);

    let gl = this.glContext;

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    this.scene = scene;
    if (!this.scene.isInitialized()) {
      this.scene.begininit(this);
    }
  }

  // TODO: add method to switch scenes.

  /**
   * @returns the current active scene.
   */
  getScene() : Scene {
    return this.scene;
  }

  getDelta() {
    return this.lastDelta;
  }

  updateDelta() {
    let timept = perf.now();
    this.lastDelta = (timept - this.lastTimePoint) / 1000;
    this.lastTimePoint = timept;
  }

  getFileLoader() {
    return this.loader;
  }

  getGLTFLoader() {
    return this.gltfLoader;
  }

  getGLContext() {
    return this.glContext;
  }

  getScreenDims() {
    // testing: https://docs.cypress.io/api/commands/viewport#Syntax
    // note: this is slow, cache once a frame instead
    let dims : [number, number] = [this.canvas.clientWidth, this.canvas.clientHeight];
    return dims;
  }

  step() {
    // handle everything in engine
    this.updateDelta();
    let gl = this.glContext;
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    // update funcs
    if (this.scene) {
      this.scene.getGameObjectRoot().updateChildren();
      // no shadow pass yet
      // find active camera
      let cam = this.findActiveCamera(this.scene.getGameObjectRoot());
      let info : CameraInfo;
      if (cam) {
        info = cam.getCameraInfo();
      } else {
        info = {
          viewMatrix: mat4.create(),
          perspectiveMatrix: mat4.create(),
          vpMatrix: mat4.create()
        };

        mat4.identity(info.viewMatrix);
        let rat = this.getScreenDims();
        mat4.perspective(info.perspectiveMatrix, 1.0826, (rat[0] / rat[1]), 0.01, 100);
        mat4.mul(info.vpMatrix, info.viewMatrix, info.perspectiveMatrix);
      }

      let rc : RenderContext = {
        getRenderPass() {
          return RenderPass.FINAL;
        },
  
        getActiveCameraInfo() {
          return info;
        }
      }
  
      this.scene.getGameObjectRoot().renderChildren(rc);
    }
  }

  private findActiveCamera(root: GameObject) : GameCamera {
    for (let child of root.getChildren()) {
      if (child instanceof GameCamera) {
        if (child.isActive()) {
          return child;
        } else {
          this.findActiveCamera(child);
        }
      }
    }
  }
}