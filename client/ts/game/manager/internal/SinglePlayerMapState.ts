// how to construct

import { GameMapState } from "../../GameMapState";
import { LayerInstance } from "../../tile/LayerInstance";
import { TileID } from "../../tile/TileID";
import { TileAtlas } from "../../TileAtlas";
import { GridTileGenerator } from "../../tilegen/GridTileGenerator";
import { TileGrid } from "../../TileGrid";

export class SinglePlayerMapState implements GameMapState {
  gen: GridTileGenerator;
  cache: TileGrid<TileID>;
  layer: Map<number, LayerInstance>;
  len: number;
  constructor(len: number) {
    this.gen = new GridTileGenerator(len);
    this.len = len;
    this.cache = new TileGrid();
    this.cache.setOrigin(0, 0);
    this.cache.setDims(128, len);
  }

  get dims() {
    return [Number.MAX_SAFE_INTEGER, this.len] as [number, number];
  }

  setLayer(layer: Map<number, LayerInstance>) {
    this.layer = layer;
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
      }
    }
  }
}