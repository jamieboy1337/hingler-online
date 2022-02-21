import { TileID } from "../tile/TileID";
import { TileGenerator } from "./TileGenerator";

export class GridTileGenerator implements TileGenerator {
  private len: number;
  private num: number;
  /**
   * Creates a new GridTileGenerator.
   * @param len - length of each column, in number of tiles.
   */
  constructor(len: number) {
    this.len = len;
    this.num = 0;
  }

  generateColumn() {
    let res : Array<TileID> = new Array(this.len);
    if (this.num % 2 === 1) {
      for (let i = 0; i < this.len; i++) {
        if (i % 2 === 1) {
          res[i] = TileID.WALL;
        } else {
          res[i] = TileID.EMPTY;
        }
      }
    }
    
    for (let i = 0; i < this.len; i++) {
      let cratechance = Math.random();
      if (res[i] !== TileID.WALL) {
        if (cratechance < 0.25) {
          // todo: convert these over t osomething better >:)
          res[i] = TileID.CRATE;
        } else {
          res[i] = TileID.EMPTY;
        }
      }
    }
    
    this.num++;
    return res;
  }
}