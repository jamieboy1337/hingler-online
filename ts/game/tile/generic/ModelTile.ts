import { Future } from "@hingler-party/ts/util/task/Future";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstance } from "../../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
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