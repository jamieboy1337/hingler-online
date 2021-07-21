import { GameContext } from "../../engine/GameContext";
import { Model } from "../../engine/storage/Model";
import { Material } from "../../material/Material";
import { ShadowNoTextureMaterial } from "../../material/ShadowNoTextureMaterial";
import { RenderContext, RenderPass } from "../../render/RenderContext";
import { GameObject } from "./GameObject";

export class GameModel extends GameObject {
  model: Model;
  private shadowTex: ShadowNoTextureMaterial;

  constructor(ctx: GameContext, init: string | Model) {
    // pass by path? pass as arg?
    // ctor raw seems like a piss idea
    super(ctx);
    this.model = null;
    this.shadowTex = new ShadowNoTextureMaterial(ctx);
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
          console.error(reason);
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
    let info = rc.getActiveCameraInfo();
    if (this.model) {
      if (rc.getRenderPass() === RenderPass.SHADOW) {
        this.shadowTex.modelMat = this.getTransformationMatrix();
        this.shadowTex.shadowMat = info.vpMatrix;
        this.shadowTex.drawMaterial(this.model);
      } else {
        material.drawMaterial(this.model);
      }
    }
  }
}