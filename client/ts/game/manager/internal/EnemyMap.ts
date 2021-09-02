import { EnemyInstance, LayerInstance, LayerInstanceInterface } from "../../tile/LayerInstance";

class EnemyMapIterator<T extends LayerInstanceInterface<T>> implements IterableIterator<[number, T]> {
  keys: IterableIterator<number>;
  map: EnemyMap<T>;
  constructor(map: EnemyMap<T>) {
    this.keys = map.keys();
    this.map = map;
  }
  next() {
    let temp = this.keys.next();

    // return copies!!! :D
    return {
      done: temp.done,
      value: [temp.value, this.map.get(temp.value)] as [number, T]
    }
  }

  [Symbol.iterator]() {
    return this;
  }
}

export class EnemyMap<T extends LayerInstanceInterface<T>> implements Map<number, T> {
  private map: Map<number, T>;
  // y is let's say 32, x is much larger
  // hash as y + x * 32.

  private positionToId: Map<number, Set<number>>;

  private hashCoordinate(x: number, y: number) {
    return Math.round(y) + Math.round(x) * 32;
  }

  constructor() {
    this.map = new Map();
    this.positionToId = new Map();
  }

  get size() {
    return this.map.size;
  }

  entries() {
    return this.map.entries();
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  getEnemiesAtCoordinate(x: number, y: number) {
    let hash = this.hashCoordinate(x, y);
    if (this.positionToId.has(hash)) {
      let ret : Array<T> = [];
      let res = this.positionToId.get(hash);
      for (let enemyID of res) {
        ret.push(this.map.get(enemyID).copyInstance());
      }

      if (ret.length > 0) {
        console.log(ret);
        console.log(x + ", " + y);
      }

      return ret;
    }

    return [];
  }

  getTilesInRange(minX: number, minY: number, maxX: number, maxY: number) {
    let ret : Array<T> = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        ret.concat(this.getEnemiesAtCoordinate(x, y));
      }
    }

    return ret;
  }

  [Symbol.iterator]() {
    // note: this is a risky vector
    // would like some way to return copies instead of the real deal since it muddies
    // our internal state
    // whatever i'll do it later
    return new EnemyMapIterator<T>(this);
  }

  get [Symbol.toStringTag]() {
    return this.map[Symbol.toStringTag];
  }

  clear() {
    this.map.clear();
    this.positionToId.clear();
  }

  delete(key: number) {
    if (this.map.has(key)) {
      let e = this.map.get(key);
      let hash = this.hashCoordinate(Math.round(e.position[0]), Math.round(e.position[1]));
      if (!this.positionToId.has(hash) || !this.positionToId.get(hash).has(key)) {
        const err = "Invariant violated: entity does not have entry in posToID!";
        throw Error(err);
      }

      this.positionToId.get(hash).delete(key);
      this.map.delete(key);
      return true;
    }

    return false;
  }

  forEach(callbackfn: (value: T, key: number, map: Map<number, T>) => void, thisArg?: any) {
    for (let key of this.map.keys()) {
      callbackfn.bind((thisArg ? thisArg : this))(this.map.get(key), key, this.map);
    }

    this.positionToId.clear();

    // assume data has been modified, rehash.

    // assume hashes might clash, but we have a guarantee that everything at a coordinate is in a hash value.
    for (let entry of this.map.keys()) {
      this.insertInstanceToPID(entry[0], entry[1]);
    }
  }

  private insertInstanceToPID(id: number, inst: T) {
    let hash = this.hashCoordinate(Math.round(inst.position[0]), Math.round(inst.position[1]));
    if (!this.positionToId.has(hash)) {
      this.positionToId.set(hash, new Set());
    }
    this.positionToId.get(hash).add(id);
  }

  get(key: number) {
    let res = this.map.get(key);
    if (res !== undefined) {
      return res.copyInstance();
    }

    return undefined;
  }

  has(key: number) {
    return this.map.has(key);
  }

  set(key: number, value: T) {
    let old = this.map.get(key);

    if (old !== undefined) {
      let oldRecord = this.positionToId.get(this.hashCoordinate(old.position[0], old.position[1]));
      if (!oldRecord || !oldRecord.has(key)) {
        throw Error("Invalidated invariant: entry not associated with position!");
      }
      oldRecord.delete(key);
    }

    this.insertInstanceToPID(key, value);
    this.map.set(key, value);
    return this;
  }


}