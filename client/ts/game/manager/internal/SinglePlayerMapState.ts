// how to construct

import { GameMapState } from "../../GameMapState";
import { TileAtlas } from "../../TileAtlas";
import { GridTileGenerator } from "../../tilegen/GridTileGenerator";
import { TileGrid } from "../../TileGrid";

export class SinglePlayerMapState implements GameMapState {
  gen: GridTileGenerator;
  cache: TileGrid<number>;
  len: number;
  constructor(len: number) {
    this.gen = new GridTileGenerator(len);
    this.len = len;
    this.cache = new TileGrid();
    this.cache.setOrigin(0, 0);
    this.cache.setDims(128, len);
  }

  get dims() {
    return [14285714, this.len] as [number, number];
  }

  fetchTiles(x: number, y: number, dx: number, dy: number) {
    // generate tiles up to our desired value and add them to the cache
    for (let i = (this.cache.origin[0] + this.cache.dims[0]); i < x + dx; i++) {
      let genTiles = this.gen.generateColumn();
      for (let j = 0; j < this.len; j++) {
        this.cache.setTile(i, j, genTiles[j]);
      }
    }

    return this.cache.slice(x, y, dx, dy);
  }
}