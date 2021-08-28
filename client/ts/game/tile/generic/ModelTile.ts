import { Future } from "../../../../../ts/util/task/Future";
import { GameContext } from "../../../engine/GameContext";
import { PBRInstance } from "../../../engine/model/PBRInstance";
import { PBRModel } from "../../../engine/model/PBRModel";
import { RenderContext, RenderPass } from "../../../engine/render/RenderContext";
import { GameTile } from "../GameTile";

// generic tile for displaying simple models
export class ModelTile extends GameTile {
  instance: Future<PBRInstance>;
  constructor(ctx: GameContext, inst: Future<PBRInstance>) {
    super(ctx);
    this.instance = inst;
  }

  renderMaterial(rc: RenderContext) {
    if (this.instance.valid()) {
      let m = this.instance.get();
      m.modelMat = this.getTransformationMatrix();
      m.draw(rc);
    }
  }
  
  destroy() {
    this.markAsClean();
  }
}