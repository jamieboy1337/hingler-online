import { TileAtlas } from "./TileAtlas";

/**
 * Stores a read/write record of tiles which currently exist.
 */
export class TileGrid<T> {
  // use for storing both current tiles and update tiles (number and gametile)
  // use a simple "get/set" interface to update data
  // add a "clear" function so that we can purge ranges of tiles from memory
  // use a resizing array to store entities
  private store: Array<Array<T>>;
  private origin_: [number, number];

  private dims_: [number, number];
  constructor() {
    this.store = [];
    this.origin_ = [0, 0];
    this.dims_ = [0, 0];
  }

  get dims() {
    return this.dims_;
  }

  get origin() {
    return this.origin_;
  }

  getTile(x: number, y: number) {
    if (x < this.origin_[0] || y < this.origin_[1] || this.store[y - this.origin_[1]] === undefined) {
      return undefined;
    }

    return this.store[y - this.origin_[1]][x - this.origin_[0]];
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

    if (y < this.origin_[1]) {
      this.dims_[1] += (this.origin_[1] - y);
      this.setOriginY(y);
    }

    if (x < this.origin_[0]) {
      this.dims_[0] += (this.origin_[0] - x);
      this.setOriginX(x);
    }

    if (this.store[y] === undefined) {
      this.store[y] = [];
    }
    this.store[y - this.origin_[1]][x - this.origin_[0]] = value;

    this.dims_[0] = Math.max(this.dims_[0], (x - this.origin_[0]) + 1);
    this.dims_[1] = Math.max(this.dims_[1], (y - this.origin_[1]) + 1);
  }

  private setOriginX(x: number) {
    for (let i = 0; i < this.store.length; i++) {
      if (this.store[i] !== undefined) {
        this.store[i] = this.adjustOrigin(this.store[i], x - this.origin_[0]);
      }
    }

    this.origin_[0] = x;
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
    this.store = this.adjustOrigin(this.store, (y - this.origin_[1]));
    this.origin_[1] = y;
  }

  /**
   * Sets the origin of this TileGrid.
   * Any points with x/y coordinate below the origin will be truncated.
   * @param x - new X origin.
   * @param y - new Y origin.
   */
  setOrigin(x: number, y: number) {
    let newDims = [this.dims_[0] - (x - this.origin_[0]), this.dims_[1] - (y - this.origin_[1])];
    this.setOriginY(y); 
    this.setOriginX(x);
    this.dims_[0] = Math.max(newDims[0], this.dims_[0]);
    this.dims_[1] = Math.max(newDims[1], this.dims_[1]);
    
  }

  getOrigin() : [number, number] {
    return Array.from(this.origin_) as [number, number];
  }

  setDims(x: number, y: number) {
    if (y < this.dims_[1]) {
      this.setDimsY(y);
    }

    if (x < this.dims_[0]) {
      this.setDimsX(x);
    }
  }

  /**
   * @param a - array we are adjusting 
   * @param shift - number of values to shift origin forward (+) or backward (-)
   */
  private adjustOrigin<U>(a: Array<U>, shift: number) : Array<U> {
    if (shift > 0) {
      return a.slice(shift);
    } else if (shift < 0) {
      let res = new Array(-shift);
      res = res.fill(null, 0, -shift);
      res = res.concat(a);
      return res;
    }

    // shift === 0
    return a;
  }

  /**
   * Returns a slice of this TileGrid as a read-only TileAtlas.
   * @param x - init x coord
   * @param y - init y coord
   * @param dx - width
   * @param dy - height
   */
  slice(x: number, y: number, dx: number, dy: number) {
    
    let xActual  = Math.floor(Math.min(Math.max(this.origin_[0], x), this.dims_[0] + this.origin_[0]));
    let yActual  = Math.floor(Math.min(Math.max(this.origin_[1], y), this.dims_[1] + this.origin_[1]));
    
    let dxActual = Math.floor(Math.max(Math.min(this.dims_[0] - (xActual - this.origin_[0]), dx), 0));
    let dyActual = Math.floor(Math.max(Math.min(this.dims_[1] - (yActual - this.origin_[1]), dy), 0));

    let originRes : [number, number] = [xActual, yActual];
    let dimsRes : [number, number] = [dxActual, dyActual];
    try {
      // not sure why the oob error is happening (null or undefined or nan cropping up??? not sure where that could even be for the crabs)
      let test = new Array(dxActual * dyActual);
    }
    catch (e) {
      console.log(dimsRes);
      console.log(`Params: ${x}, ${y} -- ${dx} by ${dy}`);
      console.log(`Actuals: ${xActual}, ${yActual} -- ${dxActual} by ${dyActual}`);
    }

    let dataRes = new Array(dxActual * dyActual);

    for (let j = 0; j < dyActual; j++) {
      for (let i = 0; i < dxActual; i++) {
        dataRes[j * dxActual + i] = this.store[j + yActual - this.origin_[1]][i + xActual - this.origin_[0]];
      }
    }

    return new TileAtlas<T>(originRes, dimsRes, dataRes);
  }
}