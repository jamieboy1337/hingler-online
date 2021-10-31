import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { InstancedModel } from "../../../../../hingler-party/client/ts/engine/model/InstancedModel";
import { InstancedModelFactory } from "../../../../../hingler-party/client/ts/engine/model/InstancedModelFactory";
import { RenderPass, RenderContext } from "../../../../../hingler-party/client/ts/engine/render/RenderContext";
import { InstancedPowerupMaterial } from "../../material/InstancedPowerupMaterial";
import { ExplosionInstanceImpl } from "./instance/internal/ExplosionInstanceImpl";
import { PowerupInstanceImpl } from "./instance/internal/PowerupInstanceImpl";
import { PowerupInstance } from "./instance/PowerupInstance";

const MODEL_MAT_INDEX = 9;
const COLOR_INDEX = 10;

export class PowerupInstanceFactory implements InstancedModelFactory<PowerupInstance> {
  private ctx: GameContext;
  private model: InstancedModel;

  // todo: write a generic instanced shadow material

  private mat: InstancedPowerupMaterial;
  private currentPass: RenderPass;
  
  constructor(ctx: GameContext, model: InstancedModel) {
    this.ctx = ctx;
    this.model = model;
    this.mat = new InstancedPowerupMaterial(ctx);
    this.currentPass = RenderPass.FINAL;

    this.mat.modelMatrixIndex = MODEL_MAT_INDEX;
    this.mat.colorIndex = COLOR_INDEX;

    this.model.setInstancedMaterial(this.mat);
  }

  getInstance() {
    return new ExplosionInstanceImpl(this.callbackfunc.bind(this));
  }

  private callbackfunc(inst: PowerupInstanceImpl, rc: RenderContext) {
    let pass = rc.getRenderPass();
    if (this.currentPass !== pass) {
      this.currentPass = pass;
      this.model.clearInstances();
    }

    this.model.appendInstanceData(MODEL_MAT_INDEX, inst.modelMat);
    this.model.appendInstanceData(COLOR_INDEX, inst.color);

    this.model.drawInstanced();
  }
}