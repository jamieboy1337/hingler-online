import { Future } from "@hingler-party/ts/util/task/Future";
import { vec4 } from "gl-matrix";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstance } from "../../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { GameTile } from "../GameTile";
import { PowerupInstance } from "../instancefactory/instance/PowerupInstance";
import { TileID } from "../TileID";

export class PowerupTile extends GameTile {
  time: number;

  base: Future<PowerupInstance>;
  power: Future<PBRInstance>;

  col: vec4;

  constructor(ctx: GameContext, base: Future<PowerupInstance>, power: Future<PBRInstance>, id: TileID) {
    super(ctx);
    this.base = base;
    this.power = power;
    switch (id) {
      case TileID.POWER_BOMB:
        this.col = [0.0, 0.15, .75, 1.0];
        break;
        case TileID.POWER_RADIUS:
        this.col = [.75, 0.0, 0.0, 1.0];
        break;
      case TileID.POWER_SPEED:
        this.col = [.75, 0.21, 0.00, 1.0];
    }

    this.time = 0;
  }

  protected update() {
    this.time += this.getContext().getDelta();
    this.setRotationEuler(0, this.time * 144, 0);
  }

  renderMaterial(rc: RenderContext) {
    let mat = this.getTransformationMatrix();
    if (this.base.valid()) {
      let base = this.base.get();
      base.modelMat = mat;
      base.color = this.col;
      base.draw(rc);
    }

    if (this.power.valid()) {
      let power = this.power.get();
      power.modelMat = mat;
      power.draw(rc);
    }
  }

  destroy() {
    this.markAsClean();
  }
}