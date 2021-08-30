// how to construct

import { PLAYER_MOTION_STATES } from "../../GameConnectionManagerSinglePlayer";
import { GameMapState } from "../../GameMapState";
import { EnemyInstance, LayerInstance } from "../../tile/LayerInstance";
import { TileID } from "../../tile/TileID";
import { TileAtlas } from "../../TileAtlas";
import { GridTileGenerator } from "../../tilegen/GridTileGenerator";
import { TileGrid } from "../../TileGrid";
import { EnemyMap } from "./EnemyMap";

export class SinglePlayerMapState implements GameMapState {
  gen: GridTileGenerator;
  cache: TileGrid<TileID>;
  layer: Map<number, LayerInstance>;
  enemy: EnemyMap;
  len: number;

  nextID: number;
  constructor(len: number) {
    this.gen = new GridTileGenerator(len);
    this.len = len;
    this.cache = new TileGrid();
    this.cache.setOrigin(0, 0);
    this.cache.setDims(128, len);

    this.layer = new Map();
    this.enemy = new EnemyMap();
    this.nextID = 0;
  }

  get dims() {
    return [Number.MAX_SAFE_INTEGER, this.len] as [number, number];
  }

  fetchTiles(x: number, y: number, dx: number, dy: number) {
    // generate tiles up to our desired value and add them to the cache
    this.generateTiles(x + dx);
    return this.cache.slice(x, y, dx, dy);
  }

  getTile(x: number, y: number) {
    this.generateTiles(x + 1);
    return this.cache.getTile(x, y);
  }

  setTile(x: number, y: number, id: TileID) {
    this.generateTiles(x + 1);
    if (y < 0 || y > this.len || x < 0) {
      console.warn("Attempting to set a tile which should not be defined!");
    }

    this.cache.setTile(x, y, id);
  }

  private generateTiles(xMax: number) {
    for (let i = (this.cache.origin[0] + this.cache.dims[0]); i < xMax; i++) {
      let genTiles = this.gen.generateColumn();
      for (let j = 0; j < this.len; j++) {
        this.cache.setTile(i, j, genTiles[j]);
        // for a random generated tile, set some probability of placing a knight
        if (genTiles[j] === TileID.EMPTY && i > 20 && (Math.random() < 0.03)) {
          // tracking ID :(
          this.enemy.set(this.nextID++, {
            direction: PLAYER_MOTION_STATES[Math.floor(Math.random() * 4)],
            type: TileID.ENEMY_KNIGHT,
            position: [i, j, 0]
          })
        }
      }
    }
  }
}