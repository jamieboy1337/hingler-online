// expose functions to draw it
// and expose functions to set instance state

import { mat4 } from "gl-matrix";
import { GameContext } from "../GameContext";
import { InstancedModelImpl } from "../loaders/internal/InstancedModelImpl";
import { InstancedShadowMaterial } from "../material/InstancedShadowMaterial";
import { PBRInstancedMaterial } from "../material/PBRInstancedMaterial";
import { RenderContext, RenderPass } from "../render/RenderContext";
import { InstancedModelFactory } from "./InstancedModelFactory";
import { PBRInstanceImpl, PBR_MODEL_MAT_INDEX } from "./internal/PBRInstanceImpl";
import { PBRInstance } from "./PBRInstance";

// factor out into impl and interface :(
export class PBRInstanceFactory implements InstancedModelFactory<PBRInstance> {
  private ctx: GameContext;
  private models: Array<InstancedModelImpl>;
  private materials: Array<PBRInstancedMaterial>;
  private shadowMat: InstancedShadowMaterial;
  private currentPass: RenderPass;

  constructor(ctx: GameContext, models: Array<InstancedModelImpl>, mats: Array<PBRInstancedMaterial>) {
    this.ctx = ctx;
    this.models = models;
    this.materials = mats;
    this.currentPass = RenderPass.FINAL;

    this.shadowMat = new InstancedShadowMaterial(this.ctx);

    for (let i = 0; i < this.models.length; i++) {
      this.models[i].setInstancedMaterial(this.materials[i]);
      this.materials[i].setModelMatrixIndex(PBR_MODEL_MAT_INDEX);
    }

    this.shadowMat.setModelMatrixIndex(PBR_MODEL_MAT_INDEX);
  }

  getInstance() {
    let inst = new PBRInstanceImpl(this.callbackfunc.bind(this));
    return inst;
  }

  private callbackfunc(mat: mat4, rc: RenderContext) {
    let pass = rc.getRenderPass();
    if (this.currentPass !== pass) {
      this.currentPass = pass;
      for (let i = 0; i < this.models.length; i++) {
        let model = this.models[i];
        // issue: imagine that we were to draw to the FB, not flush, then draw to shadow
        model.flush(rc);
        if (pass === RenderPass.SHADOW) {
          model.setInstancedMaterial(this.shadowMat);
        } else {
          model.setInstancedMaterial(this.materials[i]);
        }
      }
    }

    for (let i = 0; i < this.models.length; i++) {
      this.models[i].appendInstanceData(PBR_MODEL_MAT_INDEX, mat);
      this.models[i].drawInstanced();
    }
  }
}