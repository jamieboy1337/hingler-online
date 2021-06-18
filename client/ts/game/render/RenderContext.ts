/**
 * Passed to components on draw.
 * Contains information on the scene in general.
 */

/**
 * Identifies which render pass we should run.
 */
export enum RenderPass {
  SHADOW,
  FINAL
}

export interface RenderContext {
  // provide information on which pass is being drawn
  // provide information on which camera the object is being drawn from
}