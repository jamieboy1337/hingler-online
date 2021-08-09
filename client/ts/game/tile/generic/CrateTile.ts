import { Future } from "../../../../../ts/util/task/Future";
import { GameContext } from "../../../engine/GameContext";
import { PBRInstance } from "../../../engine/model/PBRInstance";
import { RenderContext } from "../../../engine/render/RenderContext";
import { GameTile } from "../GameTile";

export class CrateTile extends GameTile {
  instance: Future<PBRInstance>;
  constructor(ctx: GameContext, inst: Future<PBRInstance>) {
    super(ctx);
    this.instance = inst;
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