import { GameContext } from "../../../engine/GameContext";
import { InstancedModelImpl } from "../../../engine/loaders/internal/InstancedModelImpl";
import { InstancedModel } from "../../../engine/model/InstancedModel";
import { InstancedModelFactory } from "../../../engine/model/InstancedModelFactory";
import { RenderContext, RenderPass } from "../../../engine/render/RenderContext";
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
      threshold: THRESHOLD_INDEX,
      color: COLOR_INDEX,
      noise_scale: NOISE_SCALE_INDEX,
      noise_offset: NOISE_OFFSET_INDEX
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

    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.modelMat);
    this.model.appendInstanceData(THRESHOLD_INDEX, inst.threshold);
    this.model.appendInstanceData(COLOR_INDEX, inst.color);
    this.model.appendInstanceData(NOISE_SCALE_INDEX, inst.noiseScale);
    this.model.appendInstanceData(NOISE_OFFSET_INDEX, inst.noiseOffset);

    this.model.drawInstanced();
  }
} 