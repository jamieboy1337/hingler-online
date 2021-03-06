import { vec2 } from "gl-matrix";
import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { RenderType } from "../../../../hingler-party/client/ts/engine/internal/performanceanalytics";
import { PlaneModel } from "../../../../hingler-party/client/ts/engine/model/PlaneModel";
import { GameModel } from "../../../../hingler-party/client/ts/engine/object/game/GameModel";
import { RenderContext, RenderPass } from "../../../../hingler-party/client/ts/engine/render/RenderContext";
import { WaterMaterial } from "../material/water/WaterMaterial";
import { WaterShadowMaterial } from "../material/water/WaterShadowMaterial";
import { WaveStruct } from "../struct/WaveStruct";
import { xorshift32_seed, xorshift32_float } from "nekogirl-valhalla/random";

export class WaterField extends GameModel {
  private mat: WaterMaterial;
  private shadowmat: WaterShadowMaterial;
  private delta: number;

  /**
   * Creates a new WaterField
   * @param ctx - context
   * @param size - size of our ocean, in units.
   * @param subdivisions - number of subdivisions of our ocean plane.
   */
  constructor(ctx: GameContext, size: number, subdivisions: number) {
    const subdivReal = Math.min(subdivisions + 1, 2);
    super(ctx, new PlaneModel(ctx, size, size, subdivReal));
    this.mat = new WaterMaterial(ctx);
    this.shadowmat = new WaterShadowMaterial(ctx);
    this.delta = 0;

    let seed = Math.floor(Math.random() * 400000000);
    xorshift32_seed(Math.floor(Math.random() * 400000000));
    console.info(`seed: ${seed}`);

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
    const info = rc.getActiveCameraInfo();
    const id = timer.startQuery();
    if (rc.getRenderPass() === RenderPass.SHADOW) {
      this.shadowmat.modelMat = this.getTransformationMatrix();
      this.shadowmat.vpMat = info.vpMatrix;
      this.shadowmat.time = this.delta;
      this.shadowmat.drawMaterial(this.getModel());
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
      this.drawModel(rc, this.mat);
    }

    timer.stopQueryAndLog(id, "WaterField", (rc.getRenderPass() === RenderPass.SHADOW ? RenderType.SHADOW : RenderType.FINAL));
  }
}