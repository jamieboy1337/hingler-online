/**
 * Represents a range of tiles.
 */
export class TileAtlas<T> {
  readonly origin: [number, number];
  readonly dims: [number, number];
  private data: Array<T>;

  constructor(origin: [number, number], dims: [number, number], data: Array<T>) {
    this.origin = origin;
    this.dims = dims;
    this.data = data;

    if (this.data.length < this.dims[0] * this.dims[1]) {
      throw Error("Data field length is of insufficient length!");
    }
  }

  /**
   * Fetches a tile from the underlying game data and returns it.
   * @param x - X coordinate of the tile in question.
   * @param y - Y coordinate of the tile in question.
   * @returns the ID associated with the desired tile, or `null` if the tile is not contained
   *          within the bounds of this atlas.
   */
  getTile(x: number, y: number) {
    if (x >= this.origin[0] && y >= this.origin[1] && x - this.origin[0] < this.dims[0] && y - this.origin[1] < this.dims[1]) {
      return this.data[(y - this.origin[1]) * this.dims[0] + (x - this.origin[0])];
    }

    return null;
  }

  // /**
  //  * Returns a sliced version of this tile atlas.
  //  * @param x - new x origin
  //  * @param y - new y origin
  //  * @param dx - width of result
  //  * @param dy - height of result
  //  */
  // slice(x: number, y: number, dx: number, dy: number) {
  //   x = Math.min(Math.max(this.origin[0], x), this.dims[0] + this.origin[0]);
  //   y = Math.min(Math.max(this.origin[1], y), this.dims[1] + this.origin[1]);
  //   dx = Math.max(Math.min((this.dims[0] + this.origin[0]) - x, dx), 0);
  //   dy = Math.max(Math.min((this.dims[1] + this.origin[1]) - y, dy), 0);

  //   let originRes : [number, number] = [x, y];
  //   let dimsRes : [number, number] = [dx, dy];
  //   let dataRes = new Array(dx * dy);
  //   for (let j = 0; j < dy; j++) {
  //     for (let i = 0; i < dx; i++) {
  //       dataRes[j * dx + i] = this.data[(j + y) * this.dims[0] + (i + x)];
  //     }
  //   }

  //   return new TileAtlas<T>(originRes, dimsRes, dataRes);
  // }
}