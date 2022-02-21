// draw all matrices at once
// returned instances should support a callback...
// but the intended impl should be that we pass a large array of local transforms

import { mat3, mat4, ReadonlyMat3, ReadonlyMat4 } from "gl-matrix";
import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { GLBuffer } from "../../../../hingler-party/client/ts/engine/gl/internal/GLBuffer";
import { InstancedShadowMaterial } from "../../../../hingler-party/client/ts/engine/material/InstancedShadowMaterial";
import { InstancedModel } from "../../../../hingler-party/client/ts/engine/model/InstancedModel";
import { InstancedModelFactory } from "../../../../hingler-party/client/ts/engine/model/InstancedModelFactory";
import { PBRInstanceImpl } from "../../../../hingler-party/client/ts/engine/model/internal/PBRInstanceImpl";
import { PBRInstance } from "../../../../hingler-party/client/ts/engine/model/PBRInstance";
import { RenderContext, RenderPass } from "../../../../hingler-party/client/ts/engine/render/RenderContext";
import { Future } from "../../../../hingler-party/ts/util/task/Future";
import { Task } from "../../../../hingler-party/ts/util/task/Task";
import { InstancedGrassMaterial } from "../material/grass/InstancedGrassMaterial";

// note also that we need to customize the mat here
// alter the material on this instance and make sure that it flushes :D

const MAT_CHILD_INDEX = 3;
const MAT_NORMAL_INDEX = 4;

export class GrassInstanceFactory implements InstancedModelFactory<PBRInstance> {
  private ctx: GameContext;
  private model: Future<InstancedModel>;
  mat: InstancedGrassMaterial;
  private currentPass: RenderPass;
  
  constructor(ctx: GameContext, model: InstancedModel | Future<InstancedModel>) {
    this.ctx = ctx;

    // if (model instanceof Future) {
    //   this.model = model;
    // } else {
    //   const t = new Task<InstancedModel>();
    //   t.resolve(model);
    //   this.model = t.getFuture();
    // }
    
    this.mat = new InstancedGrassMaterial(ctx);

    this.mat.modelMatrixChildIndex = MAT_CHILD_INDEX;
    this.mat.normalMatrixChildIndex = MAT_NORMAL_INDEX;

    // need a new shadowmat for the child thing

    this.currentPass = RenderPass.FINAL;
  }

  set parentMat(res: ReadonlyMat4) {
    this.mat.modelMatParent = res;
  }

  getInstance() {
    return new PBRInstanceImpl(this.callbackfunc.bind(this));
  }

  drawManyInstanced(mats: Float32Array, norms: Float32Array, count: number, rc: RenderContext) {
    if (mats.length < (count * 16) || norms.length < (count * 9)) {
      throw Error("Not enough data provided to draw grass instances!");
    }

    if (this.model.valid()) {
      const model = this.model.get();
      model.setInstancedMaterial(this.mat);
      const matsActive = mats.slice(0, count * 16);
      const normsActive = norms.slice(0, count * 9);
  
      const pass = rc.getRenderPass();
      if (this.currentPass !== pass) {
        this.currentPass = pass;
        model.clearInstances();
      }
  
      model.appendInstanceData(MAT_CHILD_INDEX, matsActive);
      model.appendInstanceData(MAT_NORMAL_INDEX, normsActive);
      // model.drawManyInstanced(count);
    }
  }

  private callbackfunc(mat: ReadonlyMat4, rc: RenderContext) {
    if (this.model.valid()) {
      const model = this.model.get();
      let pass = rc.getRenderPass();
      if (this.currentPass !== pass) {
        this.currentPass = pass;
        model.clearInstances();
      }

      // const norm = mat3.fromMat4(mat3.create(), mat);
      // mat3.transpose(norm, norm);
      // mat3.invert(norm, norm);

      // model.appendInstanceData(MAT_CHILD_INDEX, mat);
      // model.appendInstanceData(MAT_NORMAL_INDEX, norm);
      // model.drawInstanced();
    }  
  }
}