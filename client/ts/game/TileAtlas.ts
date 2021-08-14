/**
 * Represents a range of tiles.
 */
export class TileAtlas {
  readonly origin: [number, number];
  readonly dims: [number, number];
  private data: Uint8Array;

  constructor(origin: [number, number], dims: [number, number], data: Uint8Array) {
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
      return this.data[y * this.dims[0] + x];
    }

    return null;
  }
}