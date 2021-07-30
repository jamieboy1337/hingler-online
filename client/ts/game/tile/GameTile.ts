import { GamePBRModel } from "../../engine/object/game/GamePBRModel";

/**
 * Represents a single game tile. (note: since we don't have multiple inheritance,
 * model-like behavior will probably be implemented by a nested child)
 */
export abstract class GameTile extends GamePBRModel {
  clean: boolean;

  /**
   * Called by parent to start destroying this tile.
   */
  destroyTile() {
    this.destroy();
  }

  /**
   * @returns true if the tile is clean, false otherwise.
   */
  isClean() : boolean {
    return this.clean;
  }

  /**
   * Called whenever a tile is destroyed, indicating a change from
   * one state to another.
   */
  protected abstract destroy() : void;

  /**
   * Called by implementers once the tile's destroy behavior is complete.
   * Denotes that the tile can be removed from the object hierarchy.
   */
  protected markAsClean() {
    this.clean = true;
  }
}