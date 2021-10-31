import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstance } from "../../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { Future } from "../../../../../ts/util/task/Future";
import { GameTile } from "../GameTile";

export class BombTile extends GameTile {
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
    // add some animation maybe?
  }
}