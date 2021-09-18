import { Future } from "../../../../ts/util/task/Future";
import { GameContext } from "../../engine/GameContext";
import { PostProcessingFilter } from "../../engine/material/PostProcessingFilter";
import { Model } from "../../engine/model/Model";
import { GameCamera } from "../../engine/object/game/GameCamera";
import { GameModel } from "../../engine/object/game/GameModel";
import { GameObject } from "../../engine/object/game/GameObject";
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