import { perf } from "../../../../ts/performance";
import { GameCamera } from "../object/game/GameCamera";
import { GameObject } from "../object/game/GameObject";
import { Scene } from "../object/scene/Scene";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";
import { GLTFLoaderImpl } from "../loaders/internal/GLTFLoaderImpl";
import { Renderer } from "./Renderer";

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
  private renderer: Renderer;
  private passOffset: number;


  constructor(canvas: HTMLCanvasElement, scene?: Scene) {
    this.lastDelta = 0;
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    this.canvas = canvas;
    this.passOffset = 0;
    this.glContext = canvas.getContext("webgl");
    this.gltfLoader = new GLTFLoaderImpl(this.loader, this);

    let gl = this.glContext;
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    this.scene = scene;
    this.renderer = new Renderer(this, this.scene);
    if (!this.scene.isInitialized()) {
      this.scene.begininit(this);
    }

    addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a") {
        this.passOffset--;
      } else if (e.key.toLowerCase() === "d") {
        this.passOffset++;
      }
    })
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
    if (this.scene) {
      this.scene.getGameObjectRoot().updateChildren();
      this.renderer.renderScene();
      let passCount = this.renderer.getPassCount();
      let disp = this.renderer.getPass(Math.abs((passCount - 1 + this.passOffset) % passCount));
      // come up with a way to display a particular pass
      this.glContext.bindFramebuffer(this.glContext.FRAMEBUFFER, null);
      disp.drawTexture();
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