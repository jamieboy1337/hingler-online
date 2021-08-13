import { GameCamera } from "../../engine/object/game/GameCamera";
import { GameObject } from "../../engine/object/game/GameObject";
import { GameMapState } from "../GameMapState";

export interface CameraManager {
  /**
   * 
   * @param world - game object representing the map and all tiles on it.
   * @param cam - game object representing the camera.
   * @param map - the most recently received map state.
   */
  updateCameraPosition(world: GameObject, cam: GameCamera, map: GameMapState) : void;
}