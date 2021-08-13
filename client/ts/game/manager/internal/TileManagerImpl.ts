import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { GameContext } from "../../../engine/GameContext";
import { GameObject } from "../../../engine/object/game/GameObject";
import { GameMapState } from "../../GameMapState";
import { GameTile } from "../../tile/GameTile";
import { TileFactory } from "../../tile/TileFactory";
import { TileManager } from "../TileManager";

export class TileManagerImpl implements TileManager {
  private ctx: GameContext;
  private lastUpdate: Uint8Array;
  private tilesCurrent: Array<GameTile>;
  private tilesDestroying: Set<GameTile>;
  private factory: TileFactory;

  readonly root: GameObject;

  constructor(ctx: GameContext, mapTitle: string) {
    this.root = new GameObject(ctx);
    this.lastUpdate = null;
    this.tilesCurrent = [];
    this.tilesDestroying = new Set();

    switch (mapTitle) {
      case "TEST_001":
        this.factory = new TileFactoryStub(ctx);
        break;
      default:
        console.warn("what");
    }
  }

  updateTiles(state: GameMapState) {
    let nextUpdate = state.tiles;
    for (let i = 0; i < nextUpdate.length; i++) {
      if (this.lastUpdate === null || nextUpdate[i] !== this.lastUpdate[i]) {
        if (this.tilesCurrent[i]) {
          this.tilesCurrent[i].destroyTile();
          // destroy elements that were removed in this update
          this.tilesDestroying.add(this.tilesCurrent[i]);
        }
        
        // create elements which are new in this update
        // TODO: use a map with some coord hash function (65536 x 65536? or stretch out one side for shits)
        // ensures that we have more flexibility in stretching out our map
        this.addTileAtCoordinate(i % state.dims[0], Math.floor(i / state.dims[0]), nextUpdate[i], state);
      }
    }

    this.lastUpdate = nextUpdate;

    // remove tiles which are already destroyed
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

  private addTileAtCoordinate(x: number, y: number, id: number, mapState: GameMapState) {
    // tiles are 2 units on a side
    // center point is 00, place tiles around it
    let newTile = this.factory.getTileFromID(id);
    let dims = mapState.dims;
    let offset = [x * 2 - dims[0] + 1, y * 2 - dims[1] + 1];
    this.tilesCurrent[y * dims[0] + x] = newTile;
    
    if (newTile !== null) {
      newTile.setPosition(offset[0], 0, offset[1]);
      this.root.addChild(newTile);
    }

  }
}