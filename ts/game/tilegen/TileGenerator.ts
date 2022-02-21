import { TileAtlas } from "../TileAtlas";
import { TileGrid } from "../TileGrid";

/**
 * simple interface for a component which generates new columns of tiles.
 */
export interface TileGenerator {
  
  /**
   * Generates the next column in a sequence.
   * @returns an array representing the indices of each generated tile.
   */
  generateColumn() : Array<number>;
}