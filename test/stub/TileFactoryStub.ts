import { GameContext } from "../../client/ts/engine/GameContext";
import { CrateTile } from "../../client/ts/game/tile/generic/CrateTile";
import { TileFactory } from "../../client/ts/game/tile/TileFactory";

export class TileFactoryStub implements TileFactory {
  ctx: GameContext;
  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  getTileFromID(id: number) {
    if (id === 0) {
      // air
      return null;
    } else {
      return new CrateTile(this.ctx);
    }
  }
}