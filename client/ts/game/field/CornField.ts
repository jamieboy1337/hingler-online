import { mat4 } from "gl-matrix";
import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstanceFactory } from "../../../../hingler-party/client/ts/engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { RenderContext } from "../../../../hingler-party/client/ts/engine/render/RenderContext";
import { Future } from "../../../../ts/util/task/Future";
import { xorshift32_float, xorshift32_seed } from "../../../../ts/util/Xorshift32";

export class CornField extends GameObject {
  private field: Future<PBRModel>;
  private corn: Future<PBRInstanceFactory>;
  private seed: number;
  private rotcache: Array<number>;
  constructor(ctx: GameContext, field: Future<PBRModel>, corn: Future<PBRInstanceFactory>, seed: number) {
    super(ctx);
    this.field = field;
    this.corn = corn;
    this.seed = seed;
  }

  renderMaterial(rc: RenderContext) {
    if (this.field.valid() && this.corn.valid()) {
      // relative to field: 2m out, 20m back
      // note that we need to apply rotations as well
      // set up such that we apply our translations first, then our local transform (more math :/)
      let field = this.field.get();
      let corn = this.corn.get().getInstance();
      let mat = this.getTransformationMatrix();
      field.drawPBR(mat, rc);

      if (!this.rotcache) {
        xorshift32_seed(this.seed);
        this.rotcache = [];
        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 21; j++) {
            this.rotcache.push(xorshift32_float() * 2 * Math.PI);
          }
        }
      }

      let cur = 0;
      let cornmat = mat4.create();
      for (let i = -2; i >= -12; i -= 2) {
        for (let j = -20; j <= 20; j += 2) {
          mat4.identity(cornmat);
          mat4.translate(cornmat, cornmat, [j, 0, i]);
          mat4.rotate(cornmat, cornmat, this.rotcache[cur++] * 2 * Math.PI, [0, 1, 0]);
          mat4.mul(cornmat, mat, cornmat);
          corn.modelMat = cornmat;
          corn.draw(rc);
        }
      }
    }
  }
  
}
