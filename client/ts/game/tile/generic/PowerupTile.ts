import { Future } from "../../../../../ts/util/task/Future";
import { GameContext } from "../../../engine/GameContext";
import { PBRInstance } from "../../../engine/model/PBRInstance";
import { RenderContext } from "../../../engine/render/RenderContext";
import { GameTile } from "../GameTile";

export class PowerupTile extends GameTile {
  time: number;
  instance: Future<PBRInstance>;

  constructor(ctx: GameContext, inst: Future<PBRInstance>) {
    super(ctx);
    this.instance = inst;
    this.time = 0;
  }

  protected update() {
    this.time += this.getContext().getDelta();
    this.setRotationEuler(0, this.time * 144, 0);
  }

  renderMaterial(rc: RenderContext) {
    if (this.instance.valid()) {
      let inst = this.instance.get();
      inst.modelMat = this.getTransformationMatrix();
      inst.draw(rc);
    }
  }

  destroy() {
    this.markAsClean();
  }
}