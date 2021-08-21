import { GameMapState } from "../../client/ts/game/GameMapState";
import { TileAtlas } from "../../client/ts/game/TileAtlas";

// TODO: loading a model over and over sucks
// create a cache for gltf scenes and models
// load from that cache whenever possible
export class GameMapStateStub implements GameMapState {
  width: number;
  height: number;
  getCount: number;
  constructor() {
    this.width = 64;
    this.height = 12;
    this.getCount = 0;
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

    let data = new Uint8Array(xDim * yDim);
    let yCursor = yActual;
    for (let i = 0; i < yDim; i++) {
      let xCursor = xActual;
      for (let j = 0; j < xDim; j++) {
        let ind = i * xDim + j;
        data[ind] = ((yCursor * this.width + xCursor) % 4);
        if ((this.getCount % 288) > 144) {
          data[ind] = 0;
        }

        xCursor++;
      }
      yCursor++;
    }

    this.getCount++;
    

    return new TileAtlas(origin, dims, data);
  }

}