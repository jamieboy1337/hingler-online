import { GameObject } from "../../engine/object/game/GameObject";
import { GameMapState } from "../GameMapState";

export interface TileManager {
  // root game object to which all tiles are appended.
  readonly root: GameObject;
  /**
   * Updates any game objects which currently appear on screen.
   * @param state - the most recently updated map state.
   */
  updateTiles(state: GameMapState) : void;
}