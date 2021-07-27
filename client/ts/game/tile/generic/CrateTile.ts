import { GameContext } from "../../../engine/GameContext";
import { MatteMaterial } from "../../../engine/material/MatteMaterial";
import { RenderContext } from "../../../engine/render/RenderContext";
import { GameTile } from "../GameTile";

export class CrateTile extends GameTile {
  mat: MatteMaterial;
  constructor(ctx: GameContext) {
    super(ctx, "../res/crate.glb");
    this.mat = new MatteMaterial(ctx);
    this.mat.color = [0.8, 0.3, 0.0, 1.0];
  }

  destroy() {
    this.markAsClean();
  }

  renderMaterial(rc: RenderContext) {
    let info = rc.getActiveCameraInfo();
    this.mat.vpMat = info.vpMatrix;
    this.mat.modelMat = this.getTransformationMatrix();
    let lights = rc.getSpotLightInfo();
    if (lights.length > 0) {
      this.mat.setSpotLight(lights);
    }
    this.drawModel(rc, this.mat);
  }
}