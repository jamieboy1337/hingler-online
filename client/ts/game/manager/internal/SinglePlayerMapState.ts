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
  layer: EnemyMap<LayerInstance>;
  enemy: EnemyMap<EnemyInstance>;
  len: number;

  nextID: number;

  knightStart: number;
  crabStart: number;
  constructor(len: number) {
    this.gen = new GridTileGenerator(len);
    this.len = len;
    this.cache = new TileGrid();
    this.cache.setOrigin(0, 0);
    this.cache.setDims(128, len);

    this.layer = new EnemyMap();
    this.enemy = new EnemyMap();
    this.nextID = 0;
  }

  get dims() {
    return [Number.MAX_SAFE_INTEGER, this.len] as [number, number];
  }

  fetchTiles(x: number, y: number, dx: number, dy: number) {
    // generate tiles up to our desired value and add them to the cache
    this.generateTiles(x + dx + 1);
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
        // for a random generated tile, set some probability of placing an enemy
        // as newer enemies appear, decrement the probability of older enemies appearing
        // use the distance from the last zone start to set the odds of enemies spawning

        // determine that we need to spawn an enemy
        // for all enemy types, run down the list (right now: crab > knight)
        // start with base, introduce 66 percent chance of upgrading
        // set 
        if (genTiles[j] === TileID.EMPTY && i > this.knightStart && (Math.random() < 0.03)) {
          // tracking ID :(
          let enemy = new EnemyInstance();
          enemy.position = [i, j, 0];
          if (i > (this.crabStart)) {
            enemy.type = TileID.ENEMY_CRAB;
          } else {
            enemy.type = TileID.ENEMY_KNIGHT;
          }

          // 30 percent chance of "downgrading" to previous enemy type
          // 70 pct cur zone
          // 21 pct last zone
          // 6.3 pct of zone before that
          // 2.7 pct even earlier... etc
          while (enemy.type > TileID.ENEMY_KNIGHT && Math.random() < 0.3) {
            enemy.type--;
          }

          enemy.direction = PLAYER_MOTION_STATES[Math.floor(Math.random() * 4)];
          this.enemy.set(this.nextID++, enemy);
        }
      }
    }
  }
}