import { GameContext } from "../../engine/GameContext";
import { Model } from "../../engine/storage/Model";
import { Material } from "../../material/Material";
import { RenderContext } from "../../render/RenderContext";
import { GameObject } from "./GameObject";

export class GameModel extends GameObject {
  model: Model;

  constructor(ctx: GameContext, init: string | Model) {
    // pass by path? pass as arg?
    // ctor raw seems like a piss idea
    super(ctx);
    this.model = null;
    if (typeof init === "string") {
      // TODO: figure out how best to expose our GLTF loader from the engine context.
      this.getContext().getGLTFLoader().loadGLTFModel(init)
        .then((res: Model[]) => {
          if (res.length > 0) {
            this.model = res[0];
          } else {
            console.error("could not assign model!");
          }
        }).catch((reason) => {
          console.error("Something went wrong while parsing model");
        });
    } else {
      // init instanceof Model
      this.model = init;
    }
  }

  /**
   * draws this model with `material`. Does not modify material state.
   * @param rc - the render context associated with this draw call.
   * @param material - the material which should be drawn.
   */
  protected drawModel(rc: RenderContext, material: Material) {
    // it doesn't seem fitting for a material to be passed here
    // at the same time, having a "setViewMatrix, etc." func on our material seems like a bad move
    // we provide this method so that clients can draw the model themselves.
    let info = rc.getActiveCameraInfo();
    if (this.model) {
      material.drawMaterial(this.model);
    }
  }
}