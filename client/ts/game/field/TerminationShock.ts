import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { Model } from "../../../../hingler-party/client/ts/engine/model/Model";
import { GameCamera } from "../../../../hingler-party/client/ts/engine/object/game/GameCamera";
import { GameModel } from "../../../../hingler-party/client/ts/engine/object/game/GameModel";
import { GameObject } from "../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { Future } from "../../../../ts/util/task/Future";
import { ExplosionFilter } from "../filter/ExplosionFilter";

export class TerminationShock extends GameModel {
  private filter: ExplosionFilter;
  constructor(ctx: GameContext, init: string | Model | Future<Model>, cam: GameCamera) {
    super(ctx, init);
    let center = new GameObject(ctx);
    center.setPosition(-64, 0, 0);
    this.addChild(center);
    this.filter = new ExplosionFilter(ctx, this, center);
    cam.addFilter(this.filter);
  }

  setBlur(dist: number) {
    this.filter.blurMag = dist;
  }
}