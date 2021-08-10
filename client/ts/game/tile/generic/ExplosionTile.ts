import { mat4 } from "gl-matrix";
import { Future } from "../../../../../ts/util/task/Future";
import { GameContext } from "../../../engine/GameContext";
import { RenderContext, RenderPass } from "../../../engine/render/RenderContext";
import { GameTile } from "../GameTile";
import { ExplosionInstance } from "../instancefactory/instance/ExplosionInstance";

export class ExplosionTile extends GameTile {
  // before destroy: lerp to 0.7 0.6 0.5
  // after destroy: lerp to 1.2 1.1 1.05
  // move noise consistently upward so that it doesn't sit in an odd state
  time: number;
  isDestroyed: boolean;
  instance: Future<ExplosionInstance>;
  thresh: number;
  constructor(ctx: GameContext, inst: Future<ExplosionInstance>) {
    super(ctx);
    this.instance = inst;
    this.time = 0;
    this.thresh = 0.2;
    this.isDestroyed = false;
  }

  protected update() {
    let delta = this.getContext().getDelta();
    this.time += delta;
    // // update time
    // let targetValue = (this.isDestroyed ? 1.05 : 0.5);
    // let t = 1.0 - Math.pow(0.001, delta);
    // this.thresh += (targetValue - this.thresh) * t;
    this.thresh = (Math.sin(this.time) + 1.0) / 2.0;
  }

  // update: do something with time, handle lerp shit

  renderMaterial(rc: RenderContext) {
    // three concentric hemispheres
    // slightly different noise offsets, thresholds, and colors
    if (rc.getRenderPass() === RenderPass.FINAL && this.instance.valid()) {
      let inst = this.instance.get();
      let mat = this.getTransformationMatrix();

      inst.modelMat = mat;
      inst.threshold = this.thresh + 0.15;
      inst.color = [1.0, 0.0, 0.0, 1.0];
      inst.noiseOffset = [0.0, this.time * 2.0, 0.0];
      inst.noiseScale = [1.5, 1.5, 1.5];
      inst.draw(rc);

      mat4.scale(mat, mat, [0.96, 0.96, 0.96]);
      inst.modelMat = mat;
      inst.threshold -= 0.1;
      inst.color = [1.0, 0.5, 0.0, 1.0];
      inst.noiseOffset[1] += 1.0;
      inst.draw(rc);

      mat4.scale(mat, mat, [0.96, 0.96, 0.96]);
      inst.modelMat = mat;
      inst.threshold -= 0.05;
      inst.color = [1.0, 1.0, 0.0, 1.0];
      inst.noiseOffset[1] += 1.0;
      inst.draw(rc);
    }
  }

  destroy() {
    // start getting rid of the explosion
  }
}