import { Future } from "@hingler-party/ts/util/task/Future";
import { mat4 } from "gl-matrix";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstance } from "../../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext, RenderPass } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { GameTile } from "../GameTile";

export class KnightTile extends GameTile {
  time: number;
  destroyed: boolean;
  instance: Future<PBRInstance>;
  frame: number;

  constructor(ctx: GameContext, inst: Future<PBRInstance>) {
    super(ctx);
    this.instance = inst;
    this.time = 0;
    this.frame = 0;
    this.destroyed = false;
  }

  protected update() {
    if (this.destroyed) {
      this.time += this.getContext().getDelta();
      this.setRotationEuler(0, Math.pow(this.time, 2.4) * 1080, 0);

      if (this.time > 1.5) {
        this.markAsClean();
      }
    }
  }

  renderMaterial(rc: RenderContext) {
    // epilepsy issue -- dissolving with dithering would be better,
    // but i'd need to work it into the pbr shader somehow :(
    if (this.frame % 2 === 0 && this.instance.valid()) {
      let mat = this.getTransformationMatrix();
      let res = mat4.identity(mat4.create());
      mat4.translate(res, res, [0, Math.pow(this.time, 2.4) * 4.5, 0]);
      mat4.mul(res, res, mat);

      let inst = this.instance.get();
      inst.modelMat = res;
      inst.draw(rc);
    }
    
    
    if (rc.getRenderPass() === RenderPass.FINAL && this.destroyed) {
      this.frame++;
    }
  }

  destroy() {
    this.destroyed = true;
  }
}