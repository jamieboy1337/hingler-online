/**
 * Passed to components on draw.
 * Contains information on the scene in general.
 */

import { AmbientLightStruct } from "../gl/struct/AmbientLightStruct";
import { SpotLightStruct } from "../gl/struct/SpotLightStruct";
import { CameraInfo } from "../object/game/Camera";

/**
 * Identifies which render pass we should run.
 */
export enum RenderPass {
  SHADOW,
  FINAL
}

export interface RenderContext {
  // provide information on which pass is being drawn
  getRenderPass() : RenderPass;

  // returns information regarding the currently active camera
  getActiveCameraInfo() : CameraInfo;

  // returns a list of spot lights associated with this render
  getSpotLightInfo() : Array<SpotLightStruct>;

  getAmbientLightInfo() : Array<AmbientLightStruct>; 

}