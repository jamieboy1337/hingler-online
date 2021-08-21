/**
 * Stores a read/write record of tiles which currently exist.
 */
export class TileGrid<T> {
  // use for storing both current tiles and update tiles (number and gametile)
  // use a simple "get/set" interface to update data
  // add a "clear" function so that we can purge ranges of tiles from memory
  // use a resizing array to store entities
  private store: Array<Array<T>>;
  private origin: [number, number];

  private dims_: [number, number];
  constructor() {
    this.store = [];
    this.origin = [0, 0];
    this.dims_ = [0, 0];
  }

  get dims() {
    return this.dims_;
  }

  getTile(x: number, y: number) {
    if (x < this.origin[0] || y < this.origin[1] || this.store[y] === undefined) {
      return undefined;
    }

    return this.store[y][x];
  }

  /**
   * Sets the contents of a particular tile.
   * @param x - the x coordinate of the tile being modified.
   * @param y - the y coordinate of the tile being modified.
   * @param value - the value which should be assigned to this tile.
   */
  setTile(x: number, y: number, value: T) {
    x = Math.floor(x);
    y = Math.floor(y);

    if (y < this.origin[1]) {
      this.setOriginY(y);
    }

    if (x < this.origin[0]) {
      this.setOriginX(x);
    }

    if (this.store[y] === undefined) {
      this.store[y] = [];
    }
    this.store[y][x] = value;

    this.dims_[0] = Math.max(this.dims_[0], x - this.origin[0]);
    this.dims_[1] = Math.max(this.dims_[1], y - this.origin[1]);
  }

  private setOriginX(x: number) {
    for (let i = 0; i < this.store.length; i++) {
      if (this.store[i] !== undefined) {
        this.store[i] = this.adjustOrigin(this.store[i], x - this.origin[0]);
      }
    }

    this.origin[0] = x;
  }

  private setDimsX(x: number) {
    for (let i = 0; i < this.store.length; i++) {
      if (this.store[i] !== undefined) {
        this.store[i] = this.store[i].slice(0, x);
      }
    }
  }

  private setDimsY(y: number) {
    this.store = this.store.slice(0, y);
  }

  private setOriginY(y: number) {
    this.store = this.adjustOrigin(this.store, (y - this.origin[1]));
    this.origin[1] = y;
  }

  /**
   * Sets the origin of this TileGrid.
   * Any points with x/y coordinate below the origin will be truncated.
   * @param x - new X origin.
   * @param y - new Y origin.
   */
  setOrigin(x: number, y: number) {
    this.setOriginY(y); 
    this.setOriginX(x);
  }

  getOrigin() : [number, number] {
    return Array.from(this.origin) as [number, number];
  }

  setDims(x: number, y: number) {
    this.setDimsY(y);
    this.setDimsX(x);
  }

  /**
   * @param a - array we are adjusting 
   * @param shift - number of values to shift origin forward (+) or backward (-)
   */
  private adjustOrigin<U>(a: Array<U>, shift: number) : Array<U> {
    if (shift > 0) {
      console.log(a.slice(shift));
      return a.slice(shift);
    } else if (shift < 0) {
      let res = [];
      console.log(res);
      res = res.fill(undefined, 0, -shift);
      res = res.concat(a);
      console.log(res);
      return res;
    }

    // shift === 0
    return a;
  }
}