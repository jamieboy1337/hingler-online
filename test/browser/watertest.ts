// test files for our plane

import {vec4} from "gl-matrix";
import {GameContext} from "../../client/ts/engine/GameContext";
import {EngineContext} from "../../client/ts/engine/internal/EngineContext";
import {MatteMaterial} from "../../client/ts/engine/material/MatteMaterial";
import {PlaneModel} from "../../client/ts/engine/model/PlaneModel";
import {GameCamera} from "../../client/ts/engine/object/game/GameCamera";
import {GameModel} from "../../client/ts/engine/object/game/GameModel";
import {GameObject} from "../../client/ts/engine/object/game/GameObject";
import {SpotLightObject} from "../../client/ts/engine/object/game/light/SpotLightObject";
import { Scene } from "../../client/ts/engine/object/scene/Scene";
import {RenderContext} from "../../client/ts/engine/render/RenderContext";

class SpinAnchor extends GameObject {
  private t: number;

  constructor(ctx: GameContext) {
    super(ctx);
    this.t = 0;

  }

  update() {
    this.t += this.getContext().getDelta();
    this.setRotationEuler(0, this.t / 4, 0);
  }
}

// wrap GameModel vs extend? probably
class WaterModelTest extends GameModel {
  private mat: MatteMaterial;

  constructor(ctx: GameContext) {
    // temp swap out with model idk why this is fucked
    super(ctx, new PlaneModel(ctx, 4, 4, 128));
    this.mat = new MatteMaterial(ctx);
    this.mat.color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
  }

  renderMaterial(rc: RenderContext) {
    console.log("render pass on twist dude");
    const info = rc.getActiveCameraInfo();
    this.mat.modelMat = this.getTransformationMatrix();
    this.mat.vpMat = info.vpMatrix;
    this.mat.cameraPos = info.cameraPosition;
    this.drawModel(rc, this.mat);
  }
}

class WaterScene extends Scene {
  constructor() {
    super();
  }

  async initialize(ctx: GameContext) {
    // create a plane model
    // give it the water material (unwritten)
    // create a camera to look at it
    // set up the camera so that it spins around
    
    let cam = new GameCamera(ctx);
    let anchor = new SpinAnchor(ctx);
    // need to extend and implement rendermaterial
    let floor = new WaterModelTest(ctx);
    let root = this.getGameObjectRoot();

    anchor.addChild(cam);
    cam.setPosition(20, 15, 0);
    cam.lookAt(0, 0, 0);
    cam.setAsActive();
    anchor.setPosition(0, 0, 0);
    floor.setPosition(0, 0, 0);

    let light = new SpotLightObject(ctx);
    light.color = [1, 1, 1, 1];
    light.intensity = 1.0;
    light.fov = 75;
    light.falloffRadius = 0.5;
    light.near = 0.2;
    light.far = 250.0;
    
    root.addChild(light);
    light.setPosition(-20, 15, 0);
    light.lookAt(0, 0, 0);

    root.addChild(anchor);
    root.addChild(floor);
  }
};

window.addEventListener("load", main);
let canvas : HTMLCanvasElement;
let ctx    : EngineContext;

async function main() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = new EngineContext(canvas, new WaterScene());
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  configureEngine();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function configureEngine() {
  ctx.deployContext();
}
