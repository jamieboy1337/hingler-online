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
    this.width = 15;
    this.height = 11;
    this.getCount = 0;
  }
  get dims() {
    return [this.width, this.height] as [number, number];
  }

  get tiles() {
    // return zeroes and ones in a cross pattern, with the upper left reserved for players
    let data = new Uint8Array(this.width * this.height);
    for (let i = 0; i < data.length; i++) {
      data[i] = (i % 4);
      if (((this.getCount % 144) > 72)) {
        data[i] = 0;
      }
    }

    this.getCount++;

    return data;
  }

  fetchTiles(x: number, y: number, dx: number, dy: number) {
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
        if ((this.getCount % 144) > 72) {
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