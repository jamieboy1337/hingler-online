import { TileFactoryStub } from "../../../test/stub/TileFactoryStub";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
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
  constructor(ctx: GameContext, conn: GameConnectionManager) {
    super(ctx);
    this.conn = conn;
    this.lastUpdate = null;
    this.tilesCurrent = [];
    this.tilesDestroying = new Set();

    switch(this.conn.getMapTitle()) {
      case "TEST_001":
        this.factory = new TileFactoryStub(this.getContext());
      default:
        console.warn("what");
    }
  }

  protected update() {
    // poll connectionmanager for state
    let newState = this.conn.getMapState();
    let nextUpdate = newState.tiles;
    for (let i = 0; i < nextUpdate.length; i++) {
      if (this.lastUpdate === null || nextUpdate[i] !== this.lastUpdate[i]) {
        if (this.tilesCurrent[i]) {
          this.tilesCurrent[i].destroyTile();
          // destroy elements that were removed in this update
          this.tilesDestroying.add(this.tilesCurrent[i]);
        }
        
        // create elements which are new in this update
        this.addTileAtCoordinate(i % newState.dims[0], Math.floor(i / newState.dims[0]), nextUpdate[i]);
      }
    }

    this.lastUpdate = nextUpdate;

    // remove tiles which are already destroyed
    let deadTiles = [];
    for (let tile of this.tilesDestroying) {
      if (tile.isClean()) {
        this.removeChild(tile.getId());
        deadTiles.push(tile);
      }
    }

    for (let tile of deadTiles) {
      this.tilesDestroying.delete(tile);
    }
  }

  private addTileAtCoordinate(x: number, y: number, id: number) {
    // tiles are 2 units on a side
    // center point is 00, place tiles around it
    let newTile = this.factory.getTileFromID(id);
    let dims = this.conn.getMapState().dims;
    let offset = [x * 2 - dims[0] + 1, y * 2 - dims[1] + 1];
    this.tilesCurrent[y * dims[0] + x] = newTile;
    
    if (newTile !== null) {
      newTile.setPosition(offset[0], 0, offset[1]);
      this.addChild(newTile);
    }

  }
}