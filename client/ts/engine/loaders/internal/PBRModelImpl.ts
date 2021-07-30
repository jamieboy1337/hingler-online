import { mat4 } from "gl-matrix";
import { GameContext } from "../../GameContext";
import { Material } from "../../material/Material";
import { PBRMaterial } from "../../material/PBRMaterial";
import { ShadowNoTextureMaterial } from "../../material/ShadowNoTextureMaterial";
import { RenderContext } from "../../render/RenderContext";
import { AttributeType, Model } from "../../storage/Model";
import { PBRModel } from "../../storage/PBRModel";

export class PBRModelImpl implements PBRModel {
  // split instances into individual models
  // each instance will be drawn with the PBR material
  readonly instances: Array<Model>;
  readonly mats: Array<PBRMaterial>;

  private shadowTex: ShadowNoTextureMaterial;

  // swap to PBR
  constructor(ctx: GameContext, instances: Array<Model>, mats: Array<PBRMaterial>) {
    if (instances.length !== mats.length) {
      throw Error("PBR model should contain one material per instance!");
    }

    this.instances = instances;
    this.mats = mats;
    this.shadowTex = new ShadowNoTextureMaterial(ctx);
  }

  bindAttribute(at: AttributeType, index: number) {
    for (let model of this.instances) {
      model.bindAttribute(at, index);
    }
  }

  draw() {
    for (let model of this.instances) {
      model.draw();
    }
  }

  drawPBR(modelMatrix: mat4, rc: RenderContext) {
    // in order to use materials: we need to know where the model is, and where the camera is.
    let info = rc.getActiveCameraInfo();
    for (let i = 0; i < this.instances.length; i++) {
      let mat = this.mats[i];
      let mod = this.instances[i];
      
      mat.cameraPos = info.cameraPosition;
      mat.modelMat = modelMatrix;
      mat.vpMat = info.vpMatrix;

      mat.setSpotLight(rc.getSpotLightInfo());
      mat.drawMaterial(mod);
    }
  }

  drawPBRShadow(modelMatrix: mat4, rc: RenderContext) {
    let info = rc.getActiveCameraInfo();
    for (let i = 0; i < this.instances.length; i++) {
      let mod = this.instances[i];

      this.shadowTex.modelMat = modelMatrix;
      this.shadowTex.shadowMat = info.vpMatrix;
      this.shadowTex.drawMaterial(mod);
    }
  }
}