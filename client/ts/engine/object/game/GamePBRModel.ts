import { GameContext } from "../../GameContext";
import { GLTFScene } from "../../loaders/GLTFScene";
import { RenderContext, RenderPass } from "../../render/RenderContext";
import { PBRModel } from "../../storage/PBRModel";
import { GameObject } from "./GameObject";

export class GamePBRModel extends GameObject {
  model: PBRModel;

  constructor(ctx: GameContext, init: string | PBRModel) {
    super(ctx);
    this.model = null;
    if (typeof init === "string") {
      this.getContext().getGLTFLoader().loadAsGLTFScene(init)
        .then((res : GLTFScene) => {
          let model = res.getPBRModel(0);
          if (model !== null) {
            this.model = model;
          } else {
            console.error("Could not assign model :(");
          }
        });
    } else {
      this.model = init;
    }
  }

  renderMaterial(rc: RenderContext) {
    if (this.model !== null) {
      let modelMat = this.getTransformationMatrix();
      if (rc.getRenderPass() === RenderPass.SHADOW) {
        this.model.drawPBRShadow(modelMat, rc);
      } else {
        this.model.drawPBR(modelMat, rc);
      }
    }
  }
}