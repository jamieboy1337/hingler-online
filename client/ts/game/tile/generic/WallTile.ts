import { Future } from "@hingler-party/ts/util/task/Future";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstance } from "../../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { GameTile } from "../GameTile";

export class WallTile extends GameTile {
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