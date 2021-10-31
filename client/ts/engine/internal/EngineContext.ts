import { perf } from "../../../../ts/performance";
import { GameCamera } from "../object/game/GameCamera";
import { GameObject } from "../object/game/GameObject";
import { Scene } from "../object/scene/Scene";
import { GameContext } from "../GameContext";
import { FileLoader } from "../loaders/FileLoader";
import { GLTFLoaderImpl } from "../loaders/internal/GLTFLoaderImpl";
import { Renderer } from "./Renderer";
import { mobileCheck } from "../../../../ts/util/MobileCheck";
import { SceneSwapImpl } from "../object/scene/internal/SceneSwapImpl";
import { ShaderEnv } from "../gl/ShaderEnv";

let uintext: OES_element_index_uint = undefined;

/**
 * INTERNAL ONLY.
 */
export class EngineContext implements GameContext {
  private lastTimePoint: number;
  private lastDelta: number;
  private loader: FileLoader;
  private gltfLoader: GLTFLoaderImpl;
  glContext: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  private scene: Scene;
  private renderer: Renderer;
  private passOffset: number;
  private dims: [number, number];

  private swapContext : EngineContext;
  private swapObject : SceneSwapImpl;

  private varMap: Map<string, any>;
  private shaderCache: ShaderEnv;
  private windowListener: () => void;

  readonly mobile: boolean;

  private getGLProxy(gl: WebGLRenderingContext) {
    gl = new Proxy(gl, {
      get: function(target, prop, _) {
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

  // create a new constructor which allows this scene to borrow assets from
  // the last ctx
  constructor(init: HTMLCanvasElement | EngineContext, scene: Scene) {
    this.lastDelta = 0; 
    this.lastTimePoint = perf.now();
    this.loader = new FileLoader();
    
    // copy over env???
    // nah we'll standardize its initialization
    if (init instanceof EngineContext) {
      this.canvas = init.canvas;
      this.glContext = init.glContext;
    } else {
      this.canvas = init;
      this.glContext = init.getContext("webgl");
    }

    this.gltfLoader = new GLTFLoaderImpl(this.loader, this);

    this.swapContext = null;
    this.swapObject = null;

    this.passOffset = 0;

    this.shaderCache = new ShaderEnv();

    this.updateScreenDims();

    this.windowListener = this.updateScreenDims.bind(this);

    // will this event listener stick around forever?
    window.addEventListener("resize", this.windowListener);
    this.mobile = true;
   
    // DEBUG LINE!!!
    // this.glContext = this.getGLProxy(this.glContext);
    
    let gl = this.glContext;
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);

    if (uintext === undefined) {
      uintext = gl.getExtension("OES_element_index_uint");
      if (uintext === null) {
        console.warn("Could not load uint index extension!");
      }
    }

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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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

  loadNewScene(scene: Scene) {
    // create a new context with this ctx and our passed scene as its initial arg
    let newContext = new EngineContext(this, scene);
    let swap = new SceneSwapImpl(newContext, scene);

    this.swapContext = newContext;
    this.swapObject = swap;
    // note: we might want to borrow shit from another scene ig
    return swap;
  }

  setContextVar(key: string, value: any, opts?: { shaderInteger: boolean }) {
    const SHADER_VAR_PREFIX = "SHADER_";
    const ind = key.indexOf(SHADER_VAR_PREFIX);
    if (ind !== -1) {
      const shaderInt = (opts !== undefined ? !!opts.shaderInteger : false);
      this.shaderCache.setShaderVar(key.substring(ind + SHADER_VAR_PREFIX.length), value, shaderInt);
    }

    this.varMap.set(key, value);
  }

  getContextVar(key: string) {
    return this.varMap.get(key);
  }

  getShaderEnv() {
    return this.shaderCache.getShaderEnv();
  }

  private glSetup() {
    let gl = this.glContext;
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  // we should kickstart the engine, and then forget this object
  deployContext() {
    // perform our gl setup here
    this.glSetup();
    this.step();
    requestAnimationFrame(this.computeFrame.bind(this));
  }

  private computeFrame() {
    this.drawFrame();
    // put swap code here
    if (this.swapObject !== null && this.swapObject.canSwap()) {
      // update delta before deploying, so we don't get a long frame time since init
      this.swapContext.updateDelta();
      requestAnimationFrame(this.swapContext.deployContext.bind(this.swapContext));
    } else {
      this.step();
      requestAnimationFrame(this.computeFrame.bind(this));
    }
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
        let disp = this.renderer.getPass(Math.abs(this.renderer.getPassCount() - 1));
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
