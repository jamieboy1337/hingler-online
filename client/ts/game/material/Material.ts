import { Model } from "../engine/storage/Model";

export interface Material {
  /**
   *  Draws the passed model with this material.
   *  @param model - the model being drawn.
   */
  drawMaterial(model: Model) : void;
}