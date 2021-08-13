import { mat4, vec3 } from "gl-matrix";
import { Framebuffer } from "../gl/Framebuffer";
import { ColorFramebuffer } from "../gl/internal/ColorFramebuffer";
import { AmbientLightStruct } from "../gl/struct/AmbientLightStruct";
import { SpotLightStruct } from "../gl/struct/SpotLightStruct";
import { ColorDisplay } from "../material/ColorDisplay";
import { ShadowDisplay } from "../material/ShadowDisplay";
import { TextureDisplay } from "../material/TextureDisplay";
import { CameraInfo } from "../object/game/Camera";
import { GameCamera } from "../object/game/GameCamera";
import { GameObject } from "../object/game/GameObject";
import { AmbientLightObject } from "../object/game/light/AmbientLightObject";
import { SpotLight } from "../object/game/light/SpotLight";
import { SpotLightObject } from "../object/game/light/SpotLightObject";
import { Scene } from "../object/scene/Scene";
import { RenderContext, RenderPass } from "../render/RenderContext";
import { EngineContext } from "./EngineContext";

class SpotLightRenderContext implements RenderContext {
  info: CameraInfo;
  constructor(light: SpotLight) {
    this.info = light.getLightMatrixAsCameraInfo();
  }

  getRenderPass() {
    return RenderPass.SHADOW;
  }

  getActiveCameraInfo() {
    return this.info;
  }

  // something else?
  getSpotLightInfo() {
    return [];
  }

  getAmbientLightInfo() {
    return [];
  }
}

/**
 * Handles rendering of our component hierarchy.
 */
export class Renderer {
  private ctx: EngineContext;
  private gl: WebGLRenderingContext;
  private scene: Scene;
  private primaryFB: Framebuffer;

  // tracks rendered textures
  private renderPasses: Array<TextureDisplay>;
  constructor(ctx: EngineContext, scene: Scene) {
    this.ctx = ctx;
    this.gl = ctx.getGLContext();

    let gl = this.gl;
    this.scene = scene;
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    this.primaryFB = new ColorFramebuffer(ctx, ctx.getScreenDims());
  }

  renderScene() {
    if (!this.scene.isInitialized()) {
      console.info("Render skipped due to uninitialized scene...");
      return;
    }
    
    let dims = this.ctx.getScreenDims();
    let old_dims = this.primaryFB.dims;
    if (dims[0] !== old_dims[0] || dims[1] !== old_dims[1]) {
      this.primaryFB.setFramebufferSize(dims);
    }
    
    this.renderPasses = [];
    let gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    // find lights
    let lights = this.findSpotLights(this.scene.getGameObjectRoot());
    let ambLights = this.findAmbientLights(this.scene.getGameObjectRoot());
    let spotLightInfo : Array<SpotLightStruct> = [];
    let ambLightInfo : Array<AmbientLightStruct> = [];

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    for (let light of lights) {
      // skip until spotlights are definitely working
      if (light.getShadowState()) {
        this.renderFromSpotLight(light);
      }
      
      spotLightInfo.push(new SpotLightStruct(this.ctx, light));
    }

    for (let light of ambLights) {
      ambLightInfo.push(new AmbientLightStruct(this.ctx, light));
    }

    // gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    let cam = this.findActiveCamera(this.scene.getGameObjectRoot());
    let info : CameraInfo;
    if (cam) {
      info = cam.getCameraInfo();
    } else {
      info = {
        viewMatrix: mat4.create(),
        perspectiveMatrix: mat4.create(),
        vpMatrix: mat4.create(),
        cameraPosition: vec3.create()
      };

      console.log("no active cam found");

      mat4.identity(info.viewMatrix);
      let rat = this.ctx.getScreenDims();
      mat4.perspective(info.perspectiveMatrix, 1.0826, (rat[0] / rat[1]), 0.01, 100);
      mat4.mul(info.vpMatrix, info.viewMatrix, info.perspectiveMatrix);
      vec3.zero(info.cameraPosition);
    }

    let rc : RenderContext = {
      getRenderPass() {
        return RenderPass.FINAL;
      },

      getActiveCameraInfo() {
        return info;
      },

      getSpotLightInfo() {
        return spotLightInfo;
      },

      getAmbientLightInfo() {
        return ambLightInfo;
      }
    }

    this.primaryFB.bindFramebuffer(gl.FRAMEBUFFER);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    let dim = this.ctx.getScreenDims();
    this.gl.viewport(0, 0, dim[0], dim[1]);
    this.scene.getGameObjectRoot().renderChildren(rc);
    for (let model of this.ctx.getGLTFLoader().getInstancedModels()) {
      model.flush(rc);
    }
    this.renderPasses.push(new ColorDisplay(this.ctx, this.primaryFB.getColorTexture()));

    gl.disable(gl.CULL_FACE);
  }

  /**
   * Once render is complete, returns the number of passes taken.
   */
  getPassCount() : number {
    return this.renderPasses.length;
  }

  /**
   * Returns the texture associated with a given pass.
   * Starts from zero and progresses in order drawn.
   * @param index - index fetched.
   * @returns Texture, or null if the index was invalid.
   */
  getPass(index: number) : TextureDisplay {
    if (index < 0 || index > this.getPassCount()) {
      return null;
    }

    return this.renderPasses[index];
  } 

  private findSpotLights(root: GameObject) : Array<SpotLightObject> {
    let lights = [];
    if (root instanceof SpotLightObject) {
      lights.push(root);
    }

    for (let child of root.getChildren()) {
      let childLights = this.findSpotLights(child);
      lights.push.apply(lights, childLights);
    }

    return lights;
  }

  private findAmbientLights(root: GameObject) : Array<AmbientLightObject> {
    let lights = [];
    if (root instanceof AmbientLightObject) {
      lights.push(root);
    }

    for (let child of root.getChildren()) {
      let childLights = this.findAmbientLights(child);
      lights.push.apply(lights, childLights);
    }

    return lights;
  }

  private renderFromSpotLight(light: SpotLightObject) {
    let rc : RenderContext = new SpotLightRenderContext(light);
    // provide the fb in context? or rebind it on each pass
    let fb = light._getShadowFramebuffer();
    fb.bindFramebuffer(this.gl.FRAMEBUFFER);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    let dim = fb.dims;
    this.gl.viewport(0, 0, dim[0], dim[1]);
    this.scene.getGameObjectRoot().renderChildren(rc);
    // flush instanced models
    for (let model of this.ctx.getGLTFLoader().getInstancedModels()) {
      model.flush(rc);
    }
    // shadow texture will contain result
    this.renderPasses.push(new ShadowDisplay(this.ctx, light));
  }

  private findActiveCamera(root: GameObject) : GameCamera {
    for (let child of root.getChildren()) {
      if (child instanceof GameCamera && child.isActive()) {
        return child;
      } else {
        let activeCamera = this.findActiveCamera(child);
        if (activeCamera !== null) {
          return activeCamera;
        }
      }
    }

    return null;
  }
}