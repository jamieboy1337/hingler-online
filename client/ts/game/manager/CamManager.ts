import { vec3 } from "gl-matrix";

/**
 * Establishes the "bounds" of this camera.
 * The bounds represent the limits of what the camera can see.
 */
export interface CameraManager {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /**
   * 
   * @param world - game object representing the map and all tiles on it.
   * @param cam - game object representing the camera.
   * @param map - the most recently received map state.
   */
  updateCameraPosition(playerPos: vec3) : void;

}
