import { vec2 } from "gl-matrix";
import { GameContext } from "../../hingler-party/client/ts/engine/GameContext";
import { EngineContext } from "../../hingler-party/client/ts/engine/internal/EngineContext";
import { RenderType } from "../../hingler-party/client/ts/engine/internal/performanceanalytics";
import { FillMaterial } from "../../hingler-party/client/ts/engine/material/FillMaterial";
import { Model } from "../../hingler-party/client/ts/engine/model/Model";
import { PlaneModel } from "../../hingler-party/client/ts/engine/model/PlaneModel";
import { GameCamera } from "../../hingler-party/client/ts/engine/object/game/GameCamera";
import { GameModel } from "../../hingler-party/client/ts/engine/object/game/GameModel";
import { GameObject } from "../../hingler-party/client/ts/engine/object/game/GameObject";
import { SpotLightObject } from "../../hingler-party/client/ts/engine/object/game/light/SpotLightObject";
import { SkyboxObject } from "../../hingler-party/client/ts/engine/object/game/SkyboxObject";
import { Scene } from "../../hingler-party/client/ts/engine/object/scene/Scene";
import { RenderContext, RenderPass } from "../../hingler-party/client/ts/engine/render/RenderContext";
import { CatmullRomSpline } from "../../hingler-party/client/ts/engine/spline/CatmullRomSpline";
import { CurveSweepModel } from "../../hingler-party/client/ts/engine/spline/CurveSweepModel";
import { DebugCurve } from "../../hingler-party/client/ts/engine/spline/DebugCurve";
import { SegmentedCurve } from "../../hingler-party/client/ts/engine/spline/SegmentedCurve";
import { Future } from "../../hingler-party/ts/util/task/Future";
import { xorshift32_seed, xorshift32_float } from "../../ts/util/Xorshift32";
import { WaterMaterial } from "./game/material/water/WaterMaterial";
import { WaterShadowMaterial } from "./game/material/water/WaterShadowMaterial";
import { WaveStruct } from "./game/struct/WaveStruct";

class SkyboxTwo extends SkyboxObject {
  private delta : number;
  constructor(ctx: GameContext, link: string) {
    super(ctx, link);
    this.delta = 0;
  }

  update() {
    this.delta += this.getContext().getDelta();
    this.intensity = Math.sin(this.delta * 3) * 0.5 + 0.5;
  }
}

class SpinAnchor extends GameObject {
  private t: number;

  constructor(ctx: GameContext) {
    super(ctx);
    this.t = 0;

  }

  update() {
    this.t += this.getContext().getDelta();
    this.setRotationEuler(0, this.t * 16.0, 0);
    this.setPosition(0, Math.sin(this.t) * 6 + 6, 0);
  }
}

// wrap GameModel vs extend? probably
class WaterModelTest extends GameModel {
  private mat: WaterMaterial;
  private shadowmat: WaterShadowMaterial;
  private delta: number;

  // vposition is world space
  // we can slide the ocean model along with the player, and it's fine!
  // create a sufficiently large plane to follow the camera
  constructor(ctx: GameContext) {
    // 0.5u works well enough i think
    super(ctx, new PlaneModel(ctx, 250, 250, 525));
    this.mat = new WaterMaterial(ctx);
    this.shadowmat = new WaterShadowMaterial(ctx);
    this.delta = 0;

    // main waves
    let seed = Math.floor(Math.random() * 400000000);
    xorshift32_seed(Math.floor(Math.random() * 400000000));
    console.log(`seed: ${seed}`);

    const waveDirection = [xorshift32_float() - 0.5, xorshift32_float() - 0.5] as [number, number];

    const ampWavelengthRatio = 14;

    for (let i = 0; i < 4; i++) {
      let wave = new WaveStruct(ctx);
      wave.direction = vec2.copy(vec2.create(), waveDirection);
      vec2.rotate(wave.direction, wave.direction, [0, 0], (xorshift32_float() - 0.5) * 1.5);
      vec2.normalize(wave.direction, wave.direction);
      wave.amp = Math.pow(0.5, xorshift32_float() * 2) * 0.35;
      wave.freq = 2.0 / (wave.amp * ampWavelengthRatio);
      wave.speed = (0.9 + 2.8 * xorshift32_float()) * 1.4 * wave.amp;
      wave.steepness = 0.21;
      this.mat.waves.push(wave);
    }

    this.shadowmat.waves = this.mat.waves;
  }

  update() {
    this.delta += this.getContext().getDelta();
  }

  renderMaterial(rc: RenderContext) {
    const timer = this.getContext().getGPUTimer();
    const id = timer.startQuery();
    const info = rc.getActiveCameraInfo();
    let type: RenderType;
    if (rc.getRenderPass() === RenderPass.SHADOW) {
      this.shadowmat.modelMat = this.getTransformationMatrix();
      this.shadowmat.vpMat = info.vpMatrix;
      this.shadowmat.time = this.delta;
      this.shadowmat.drawMaterial(this.getModel());
      type = RenderType.SHADOW;
    } else {
      this.mat.modelMat = this.getTransformationMatrix();
      this.mat.vpMat = info.vpMatrix;
      this.mat.time = this.delta;
      this.mat.lights = rc.getSpotLightInfo();
      this.mat.camerapos = info.cameraPosition;

      const skyList = rc.getSkybox();
      if (skyList.length > 0) {
        const sky = skyList[0];
        this.mat.cubemapDiffuse = sky.irridance;
        this.mat.cubemapSpec = sky.specular;
        this.mat.texBRDF = sky.brdf;
        this.mat.skyboxIntensity = sky.intensity;
      }
      this.drawModel(rc, this.mat);

      type = RenderType.FINAL;
    }
    
    timer.stopQueryAndLog(id, "WaterMaterial", type);
  }
}

class CurveScene extends GameModel {
  mat: FillMaterial;
  
  constructor(ctx: GameContext, model: string | Model | Future<Model>) {
    super(ctx, model);
    this.mat = new FillMaterial(ctx);
    this.mat.col = [1, 1, 1, 1];
  }

  renderMaterial(rc: RenderContext) {
    const gl = this.getContext().getGLContext();
    this.mat.modelMat = this.getTransformationMatrix();
    this.mat.vpMat = rc.getActiveCameraInfo().vpMatrix;
    this.drawModel(rc, this.mat);
  }
}

class WaterScene extends Scene {
  constructor() {
    super();
  }

  async initialize(ctx: GameContext) {
    const gl = ctx.getGLContext();
    // create a plane model
    // give it the water material (unwritten)
    // create a camera to look at it
    // set up the camera so that it spins around
    
    let cam = new GameCamera(ctx);
    let anchor = new SpinAnchor(ctx);
    // need to extend and implement rendermaterial
    let floor = new WaterModelTest(ctx);
    let root = this.getGameObjectRoot();

    const skybox = new SkyboxTwo(ctx, "../res/hdr/hdr_bridge_1k.hdr");
    root.addChild(skybox);

    anchor.addChild(cam);
    cam.setPosition(0, 12, 40);
    cam.lookAt(0, 0, 0);
    cam.setAsActive();
    anchor.setPosition(0, 0, 0);
    floor.setPosition(0, 0, 0);
    cam.near = 1.0;
    cam.far = 500.0;

    let light = new SpotLightObject(ctx);
    light.color = new Float32Array([1, 1, 1, 1]);
    light.intensity = 1.0;
    light.fov = 50;
    light.falloffRadius = 0.3;
    light.near = 4.0;
    light.far = 750.0;

    light.atten_quad = 0;
    light.atten_linear = 0;
    light.atten_const = 1;

    light.setShadows(false);
    
    // root.addChild(light);
    light.setPosition(-120, 125, 0);
    light.lookAt(0, 0, 0);

    root.addChild(anchor);
    root.addChild(floor);

    const curve = new CatmullRomSpline();
    curve.addPoint(0, 0, 0);
    curve.addPoint(16, 12, 4);
    curve.addPoint(-24, 15, -3);
    curve.addPoint(-3, 25, 1);

    const test = new SegmentedCurve([[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0], [0, 0, 1]]);

    const curveModel = new CurveSweepModel(ctx, curve, test);

    const obj = new CurveScene(ctx, curveModel);

    // const curvedisp = new DebugCurve(ctx, curve);
    
    root.addChild(obj);
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
