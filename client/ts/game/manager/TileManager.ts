import { GameObject } from "../../engine/object/game/GameObject";
import { GameMapState } from "../GameMapState";
import { PlayerState } from "../PlayerState";

export interface TileManager {
  // root game object to which all tiles are appended.
  readonly root: GameObject;
  /**
   * Updates any game objects which currently appear on screen.
   * @param state - the most recently updated map state.
   */
  updateTiles(state: GameMapState, players: Map<number, PlayerState>) : void;

  /**
   * Sets the X/Y coordinates of tile [0, 0].
   * @param dims - the point at which tile [0, 0] should appear.
   */
  setTileOrigin(dims: [number, number]) : void;
}