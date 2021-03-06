import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { InstancedModel } from "../../../../../hingler-party/client/ts/engine/model/InstancedModel";
import { InstancedModelFactory } from "../../../../../hingler-party/client/ts/engine/model/InstancedModelFactory";
import { RenderPass, RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { InstancedExplosionMaterial } from "../../material/InstancedExplosionMaterial";
import { ExplosionInstance } from "./instance/ExplosionInstance";
import { ExplosionInstanceImpl } from "./instance/internal/ExplosionInstanceImpl";

export const MODEL_MAT_INDEX = 4;
export const THRESHOLD_INDEX = 5;
export const COLOR_INDEX = 6;
export const NOISE_SCALE_INDEX = 7;
export const NOISE_OFFSET_INDEX = 8;

export class ExplosionInstanceFactory implements InstancedModelFactory<ExplosionInstance> {
  private ctx: GameContext;
  private model: InstancedModel;
  private mat: InstancedExplosionMaterial;
  private currentPass: RenderPass;
  // todo: write instanced material
  // have it handle shadows and others
 
  constructor(ctx: GameContext, model: InstancedModel) {
    this.ctx = ctx;
    this.model = model;
    this.mat = new InstancedExplosionMaterial(ctx);
    this.currentPass = RenderPass.FINAL;

    this.mat.instanceIndices = {
      modelMat: MODEL_MAT_INDEX,
      threshold: MODEL_MAT_INDEX,
      color: MODEL_MAT_INDEX,
      noise_offset: MODEL_MAT_INDEX
    };
    this.model.setInstancedMaterial(this.mat);
  }

  getInstance() {
    let inst = new ExplosionInstanceImpl(this.callbackfunc.bind(this)); 
    return inst;
  }

  private callbackfunc(inst: ExplosionInstanceImpl, rc: RenderContext) {
    let pass = rc.getRenderPass();
    if (this.currentPass !== pass) {
      this.currentPass = pass;
      this.model.clearInstances();
    }

    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.modelMat); // 64
    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.threshold); // 68
    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.color); // 84
    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.noiseOffset); // 96

    this.model.drawInstanced();
  }
} 