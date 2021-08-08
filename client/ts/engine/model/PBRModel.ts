import { mat4 } from "gl-matrix";
import { RenderContext } from "../render/RenderContext";
import { Model } from "./Model";

export interface PBRModel extends Model {
  /**
   * Like draw(), but uses a PBR shader whose parameters are predetermined.
   * @param modelMatrix - the modelmatrix for the model being drawn.
   * @param rc - the rendercontext for the current frame.
   */
  drawPBR(modelMatrix: mat4, rc: RenderContext) : void;

  /**
   * Like drawPBR, but uses a shadow material for shadow textures :)
   */
  drawPBRShadow(modelMatrix: mat4, rc: RenderContext) : void;
}