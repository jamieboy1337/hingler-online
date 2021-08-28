import { GameMapState } from "../../client/ts/game/GameMapState";
import { GameTile } from "../../client/ts/game/tile/GameTile";
import { EnemyInstance, LayerInstance } from "../../client/ts/game/tile/LayerInstance";
import { TileAtlas } from "../../client/ts/game/TileAtlas";

// TODO: loading a model over and over sucks
// create a cache for gltf scenes and models
// load from that cache whenever possible
export class GameMapStateStub implements GameMapState {
  width: number;
  height: number;
  getCount: number;
  layer: Map<number, LayerInstance>;
  enemy: Map<number, EnemyInstance>;
  constructor() {
    this.width = 512;
    this.height = 11;
    this.getCount = 0;
    this.layer = new Map();
    this.enemy = new Map();
  }
  get dims() {
    return [this.width, this.height] as [number, number];
  }

  fetchTiles(x: number, y: number, dx: number, dy: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    dx = Math.ceil(dx);
    dy = Math.ceil(dy);
    let xActual = Math.min(Math.max(x, 0), this.width - 1);
    let yActual = Math.min(Math.max(y, 0), this.height - 1);
    let origin : [number, number] = [xActual, yActual];

    let xDim = Math.min(this.width - xActual, dx);
    let yDim = Math.min(this.height - yActual, dy);
    let dims : [number, number] = [xDim, yDim];

    let data = new Array(xDim * yDim);
    let yCursor = yActual;
    for (let i = 0; i < yDim; i++) {
      let xCursor = xActual;
      for (let j = 0; j < xDim; j++) {
        let ind = i * xDim + j;
        data[ind] = ((yCursor * this.width + xCursor + yCursor) % 4);
        if ((this.getCount % 576) > 288) {
          data[ind] = 0;
        }

        xCursor++;
      }
      yCursor++;
    }

    this.getCount++;
    

    return new TileAtlas<number>(origin, dims, data);
  }

}