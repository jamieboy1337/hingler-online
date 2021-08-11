import { GameMapState } from "../../client/ts/game/GameMapState";

// TODO: loading a model over and over sucks
// create a cache for gltf scenes and models
// load from that cache whenever possible
export class GameMapStateStub implements GameMapState {
  width: number;
  height: number;
  constructor() {
    this.width = 16;
    this.height = 12;
  }
  get dims() {
    return [this.width, this.height] as [number, number];
  }

  get tiles() {
    // return zeroes and ones in a cross pattern, with the upper left reserved for players
    let data = new Uint8Array(this.width * this.height);
    for (let i = 0; i < data.length; i++) {
      data[i] = ((i + Math.floor(i / this.width)) % 4); 
    }

    return data;
  }

}