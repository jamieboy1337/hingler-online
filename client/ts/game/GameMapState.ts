import { LayerInstance } from "./tile/LayerInstance";
import { TileAtlas } from "./TileAtlas";

// modify a good bit -- this "tiles" field doesn't work yet
export interface GameMapState {
  readonly dims: [number, number];
  // record of all layer objects
  readonly layer: Map<number, LayerInstance>;

  /**
   * Fetches a range of tiles from this GameMapState.
   * If the user attempts to fetch tiles which are out of bounds, only the in-bounds portion of
   * their query will be returned.
   * @param x - the minimum x coordinate from which we want to begin returning tiles.
   * @param y - the minimum y coordinate from which we want to begin returning tiles.
   * @param dx - the maximum number of tiles we want to fetch along the x direction.
   * @param dy - the maximum number of tiles we want to fetch along the y direction.
   */
  fetchTiles(x: number, y: number, dx: number, dy: number) : TileAtlas<number>;
}