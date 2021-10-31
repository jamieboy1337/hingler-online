import { mat4 } from "gl-matrix";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { RenderContext, RenderPass } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { Future } from "../../../../../ts/util/task/Future";
import { GameTile } from "../GameTile";
import { ExplosionInstance } from "../instancefactory/instance/ExplosionInstance";

export class ExplosionTile extends GameTile {
  // before destroy: lerp to 0.7 0.6 0.5
  // after destroy: lerp to 1.2 1.1 1.05
  // move noise consistently upward so that it doesn't sit in an odd state
  time: number;
  startDestroy: boolean;
  instance: Future<ExplosionInstance>;
  thresh: number;
  explosionScale: number;
  constructor(ctx: GameContext, inst: Future<ExplosionInstance>) {
    super(ctx);
    this.instance = inst;
    this.time = 0;
    this.thresh = 0.45;
    this.explosionScale = 0.65;
    this.startDestroy = false;
  }

  protected update() {
    let delta = this.getContext().getDelta();
    this.time += delta;
    // update time
    let targetValue = (this.startDestroy ? 1.05 : 0.705);
    // current approach looks like shit when we drop frames
    let t = 1.0 - Math.pow(0.1, delta);
    let tScale = 1.0 - Math.pow(0.01, delta);
    this.explosionScale += (1.0 - this.explosionScale) * tScale;
    this.thresh += (targetValue - this.thresh) * t;
    if (this.thresh > 1.00) {
      this.markAsClean();
    }

    this.setScale(this.explosionScale, this.explosionScale / 2.0, this.explosionScale);
  }

  // update: do something with time, handle lerp shit

  renderMaterial(rc: RenderContext) {
    // three concentric hemispheres
    // slightly different noise offsets, thresholds, and colors
    if (rc.getRenderPass() === RenderPass.FINAL && this.instance.valid()) {
      let inst = this.instance.get();
      let mat = mat4.copy(mat4.create(), this.getTransformationMatrix());

      inst.modelMat = mat;
      inst.threshold = this.thresh + 0.075;
      inst.color = [1.0, 0.0, 0.0, 1.0];
      inst.noiseOffset = [0.0, this.time * 3.1, 0.0];
      inst.noiseScale = [1.5, 1.5, 1.5];

      inst.draw(rc);

      mat4.scale(mat, mat, [0.96, 0.96, 0.96]);
      mat4.rotateY(mat, mat, 2.0941);
      inst.modelMat = mat;
      inst.threshold -= 0.05;
      inst.color = [1.0, 0.5, 0.0, 1.0];
      inst.noiseOffset[1] += 1.0;
      inst.noiseOffset[1] *= 0.7;
      inst.draw(rc);

      mat4.scale(mat, mat, [0.96, 0.96, 0.96]);
      inst.modelMat = mat;
      inst.threshold -= 0.025;
      inst.color = [1.0, 1.0, 0.0, 1.0];
      inst.noiseOffset[1] += 1.0;
      inst.noiseOffset[1] *= 2.1;
      inst.draw(rc);
    }
  }

  destroy() {
    this.startDestroy = true;
  }
}