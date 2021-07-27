import { GameTile } from "./GameTile";

/**
 * Generates tiles based on tile identifier for a given map, etc.
 */
export interface TileFactory {
  /**
   * @returns A game object representing the desired tile.
   * @param id - the id associated with the desired tile.
   */
  getTileFromID(id: number) : GameTile;
}