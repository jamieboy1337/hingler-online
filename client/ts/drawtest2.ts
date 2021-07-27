import { GameContext } from "./engine/GameContext";
import { EngineContext } from "./engine/internal/EngineContext";
import { Model } from "./engine/storage/Model";
import { MatteMaterial } from "./engine/material/MatteMaterial";
import { TextureAlbedoMaterial } from "./engine/material/TextureAlbedoMaterial";
import { GameCamera } from "./engine/object/game/GameCamera";
import { GameModel } from "./engine/object/game/GameModel";
import { SpotLightObject } from "./engine/object/game/light/SpotLightObject";
import { Scene } from "./engine/object/scene/Scene";
import { RenderContext } from "./engine/render/RenderContext";


window.addEventListener("load", main);

class DummyCamera extends GameCamera {
  time: number;
  constructor(ctx: GameContext) {
    super(ctx);
    this.time = 0;
  }

  update() {
    this.time += this.getContext().getDelta();
    this.setPosition(Math.sin(this.time * 6) * 4, 0, 15);
    this.lookAt(0, 0, 0);
  }
}

class CrapModel extends GameModel {
  time: number;
  mat: MatteMaterial;
  constructor(ctx: GameContext, init: Model | string) {
    super(ctx, init);
    this.time = 0;
    this.mat = new MatteMaterial(ctx);
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;
  }

  update() {
    this.time += this.getContext().getDelta();
  }

  renderMaterial(rc: RenderContext) {
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;
    let info = rc.getActiveCameraInfo();
    this.mat.vpMat = info.vpMatrix;
    this.mat.modelMat = this.getTransformationMatrix();
    let lights = rc.getSpotLightInfo();
    if (lights.length > 0) {
      this.mat.setSpotLight(lights);
    }
    this.drawModel(rc, this.mat);
  }
}

class DummyModel extends GameModel {
  time: number;
  mat: MatteMaterial;
  constructor(ctx: GameContext, init: Model | string) {
    super(ctx, init);
    this.time = 0;
    this.mat = new MatteMaterial(ctx);
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;
  }

  update() {
    this.time += this.getContext().getDelta();
    this.setRotationEuler(this.time * 360, 0, 0);
  }

  renderMaterial(rc: RenderContext) {
    console.info("dummyrender");
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;
    let info = rc.getActiveCameraInfo();
    this.mat.vpMat = info.vpMatrix;
    this.mat.modelMat = this.getTransformationMatrix();
    let lights = rc.getSpotLightInfo();
    if (lights.length > 0) {
      this.mat.setSpotLight(lights);
    }
    this.drawModel(rc, this.mat);
  }
}

class TextureTest extends DummyModel {
  texmat: TextureAlbedoMaterial;
  constructor(ctx: GameContext, init: Model | string) {
    super(ctx, init);
    this.texmat = new TextureAlbedoMaterial(ctx);
    this.loadTexture();
  }

  private async loadTexture() {
    let loader = this.getContext().getGLTFLoader();
    let scene = await loader.loadAsGLTFScene("../res/test.glb");
    this.texmat.tex = scene.getTexture("Untitled");
    console.log(this.texmat.tex);
  }

  renderMaterial(rc: RenderContext) {
    let info = rc.getActiveCameraInfo();
    this.texmat.modelMat = this.getTransformationMatrix();
    this.texmat.vpMat = info.vpMatrix;
    this.drawModel(rc, this.texmat);
  }
}

let ctx : EngineContext;

// add findactivecamera to scene
class TestScene extends Scene {
  initialize(ctx: GameContext) {
    let root = this.getGameObjectRoot();
    let model = new TextureTest(ctx, "../res/test.glb");
    let modelt = new CrapModel(ctx, "../res/crate.glb");
    let cam = new DummyCamera(ctx);
    let light = new SpotLightObject(ctx);
    light.setPosition(0, 0, 5);
    light.setRotationEuler(0, 0, 0);
    light.fov = 82;
    light.falloffRadius = 1.0;
    light.atten_const = 1;
    light.atten_linear = 0;
    light.atten_quad = 0;
    light.color = new Float32Array([1, 1, 1, 1]);
    light.intensity = 1;
    cam.fov = 45;

    modelt.setScale(3.6, 3.6, 3.6);
    modelt.setPosition(0, 0, -15);
    cam.setPosition(0, 0, 15);
    root.addChild(model);
    root.addChild(cam);
    root.addChild(light);
    root.addChild(modelt);
    // TODO: add specific debug shader for shadows bc they dont render correctly atm
    // some addl data associating them with cams is required for that (near/far planes only)
    cam.setAsActive();
  }
}

function main() {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = new EngineContext(canvas, new TestScene());
  requestAnimationFrame(thehingler);
}

function thehingler() {
  ctx.step();
  requestAnimationFrame(thehingler);
}