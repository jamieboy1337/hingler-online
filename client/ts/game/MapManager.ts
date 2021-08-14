import { TileFactoryStub } from "../../../test/stub/TileFactoryStub";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
import { TileManagerSinglePlayer } from "./manager/internal/TileManagerSinglePlayer";
import { TileManager } from "./manager/TileManager";
import { GameTile } from "./tile/GameTile";
import { TileFactory } from "./tile/TileFactory";

/**
 * Handles creation of components pertaining to game connection.
 * Should this also contain the connection manager? probably :)
 */
export class MapManager extends GameObject {
  conn: GameConnectionManager;
  lastUpdate: Uint8Array;
  // contains all tiles at present.
  // in real gameconn: do not create the map manager until the connection is ready.
  tilesCurrent: Array<GameTile>;
  tilesDestroying: Set<GameTile>;
  factory: TileFactory;
  tilemgr: TileManager;
  constructor(ctx: GameContext, conn: GameConnectionManager) {
    super(ctx);
    this.conn = conn;
    this.lastUpdate = null;
    this.tilesCurrent = [];
    this.tilesDestroying = new Set();
    this.tilemgr = new TileManagerSinglePlayer(ctx, this.conn.getMapTitle());
    this.addChild(this.tilemgr.root);
    this.tilemgr.root.setPosition(0, 0, 0);

    switch(this.conn.getMapTitle()) {
      case "TEST_001":
        this.factory = new TileFactoryStub(this.getContext());
      default:
        console.warn("what");
    }
  }

  protected update() {
    let state = this.conn.getMapState();
    this.tilemgr.setTileOrigin([-state.dims[0] + 1, -state.dims[1] + 1]);
    this.tilemgr.updateTiles(this.conn.getMapState());
  }
}