import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { GameContext } from "../../../engine/GameContext";
import { GameObject } from "../../../engine/object/game/GameObject";
import { GameMapState } from "../../GameMapState";
import { GameTile } from "../../tile/GameTile";
import { TileFactory } from "../../tile/TileFactory";
import { TileGrid } from "../../TileGrid";
import { TileManager } from "../TileManager";

export class TileManagerSinglePlayer implements TileManager {
  private ctx: GameContext;
  private tilesDestroying: Set<GameTile>;
  private factory: TileFactory;
  private tilesCurrentGrid: TileGrid<GameTile>;
  private lastUpdateGrid: TileGrid<number>;
  private origin: [number, number];

  readonly root: GameObject;

  constructor(ctx: GameContext, mapTitle: string) {
    this.root = new GameObject(ctx);
    this.tilesDestroying = new Set();

    this.lastUpdateGrid = new TileGrid();
    this.tilesCurrentGrid = new TileGrid();

    switch (mapTitle) {
      case "TEST_001":
        this.factory = new TileFactoryStub(ctx);
        break;
      default:
        console.warn("what");
    }
  }

  setTileOrigin(origin: [number, number]) {
    this.origin = origin;
  }

  updateTiles(state: GameMapState) {
    let tiles = state.fetchTiles(0, 0, 1000, 1000);
    let xOrigin = tiles.origin[0];
    let yOrigin = tiles.origin[1];
    let xDims = tiles.dims[0] + xOrigin;
    let yDims = tiles.dims[1] + yOrigin;

    for (let i = xOrigin; i < xDims; i++) {
      for (let j = yOrigin; j < yDims; j++) {
        let tileID = tiles.getTile(i, j);
        if (tileID !== this.lastUpdateGrid.getTile(i, j)) {
          let tile = this.tilesCurrentGrid.getTile(i, j);
          if (tile) {
            tile.destroyTile();
            this.tilesDestroying.add(tile);
          }

          let offset = [i * 2 + this.origin[0], j * 2 + this.origin[1]];
          let newTile = this.factory.getTileFromID(tileID);
          if (newTile !== null) {
            newTile.setPosition(offset[0], 0, offset[1]);
            this.root.addChild(newTile);
          }

          this.tilesCurrentGrid.setTile(i, j, newTile);
          this.lastUpdateGrid.setTile(i, j, tileID);
        }
      }
    }
    
    let deadTiles = [];
    for (let tile of this.tilesDestroying) {
      if (tile.isClean()) {
        this.root.removeChild(tile.getId());
        deadTiles.push(tile);
      }
    }

    for (let tile of deadTiles) {
      this.tilesDestroying.delete(tile);
    }
  }

  private handleFloorTiles() {
    // figure out where the player is
    // add two tiles to their left and right if they're not already there
    // use the origin as an anchor point
  }
}