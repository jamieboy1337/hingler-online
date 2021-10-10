import { perf } from "../../../../ts/performance";
import { GameCamera } from "../object/game/GameCamera";
import { GameObject } from "../object/game/GameObject";
import { Scene } from "../object/scene/Scene";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";
import { GLTFLoaderImpl } from "../loaders/internal/GLTFLoaderImpl";
import { Renderer } from "./Renderer";
import { mobileCheck } from "../../../../ts/util/MobileCheck";

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

  private dims: [number, number];

  readonly mobile: boolean;

  private getGLProxy(gl: WebGLRenderingContext) {
    gl = new Proxy(gl, {
      get: function(target, prop, receiver) {
        let res = target[prop];
        if (typeof res === "function") {
          let func = res as Function;
          return (...args: any) => {
            let res = func.apply(target, args);
            let err = target.getError();
            if (err !== target.NO_ERROR) {
              console.error("Err generated by last gl call to " + prop.toString() + ": " + err);
            }
            return res;
          }
        } else {
          return res;
        }
      }
    });

    return gl;
  } 

  constructor(canvas: HTMLCanvasElement, scene?: Scene) {
    this.lastDelta = 0; 
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    this.canvas = canvas;
    this.passOffset = 0;
    this.glContext = canvas.getContext("webgl");
    this.gltfLoader = new GLTFLoaderImpl(this.loader, this);
    this.updateScreenDims();
    window.addEventListener("resize", this.updateScreenDims.bind(this));
    this.mobile = mobileCheck();

    // doesn't work -- if we ctor a new engine context w a new scene,
    // this will be irrelevant.
    // alt: wipe the cache on swap doesn't work, because there's too many
    // assets being exchanged.
    // having all files loaded into mem is a bad idea

    // new context sounds like the best solution...
    // maybe move this to a separate method, which runs when the ctx takes control?
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
      if (e.code === "PageUp") {
        this.passOffset--;
      } else if (e.code === "PageDown") {
        this.passOffset++;
      }
    })
  }

  private updateScreenDims() {
    this.dims = [this.canvas.clientWidth, this.canvas.clientHeight];
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
    return this.dims;
  }

  // we should kickstart the engine, and then forget this object
  deployContext() {
    this.step();
    requestAnimationFrame(this.computeFrame.bind(this));
  }

  private computeFrame() {
    this.drawFrame();
    this.step();
    requestAnimationFrame(this.computeFrame.bind(this));
  }

  step() {
    this.updateDelta();
    if (this.scene && this.scene.isInitialized()) {
      this.scene.getGameObjectRoot().updateChildren();
      this.renderer.renderScene();
    }
  }

  drawFrame() {
    if (this.scene && this.scene.isInitialized()) {
      let passCount = this.renderer.getPassCount();
      if (passCount > 0) {
        let disp = this.renderer.getPass(Math.abs(passCount - 1));
        this.glContext.bindFramebuffer(this.glContext.FRAMEBUFFER, null);
        this.glContext.clear(this.glContext.COLOR_BUFFER_BIT | this.glContext.DEPTH_BUFFER_BIT);
        disp.drawTexture();
        this.glContext.flush();
      }
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