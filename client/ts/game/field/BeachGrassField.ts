import { Future } from "@hingler-party/ts/util/task/Future";
import { mat3, mat4, ReadonlyMat4, vec3 } from "gl-matrix";
import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { InstancedModel } from "../../../../hingler-party/client/ts/engine/model/InstancedModel";
import { PBRInstanceFactory } from "../../../../hingler-party/client/ts/engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { RenderContext } from "../../../../hingler-party/client/ts/engine/render/RenderContext";
import { GrassInstanceFactory } from "../map/GrassInstanceFactory";
import { InstancedGrassMaterial } from "../material/grass/InstancedGrassMaterial";
import { xorshift32_float, xorshift32_seed } from "nekogirl-valhalla/random";

const GRASS_RADIUS_MIN = 0.8;
const GRASS_RADIUS_MAX = 1.1;
const GRASS_SCALE_CONST = 0.25;

const GRASS_ROT_AXIS : [number, number, number] = [0, 1, 0];
const GRASS_SCALE    : [number, number, number] = [GRASS_SCALE_CONST, GRASS_SCALE_CONST, GRASS_SCALE_CONST];

export class BeachGrassField extends GameObject {
  private field: Future<PBRModel>;
  private grass: Future<InstancedModel>;
  private seed: number;

  private instanceFac: GrassInstanceFactory;
  private matcache: Array<ReadonlyMat4>;
  private matcachefloat: Float32Array;
  private normcachefloat: Float32Array;

  private bladeCount: number;
  // arrange normally
  // ideally it'll fade out when we get to the hill
  constructor(ctx: GameContext, field: Future<PBRModel>, grass: Future<InstancedModel>, seed: number) {
    super(ctx);
    this.field = field;
    this.grass = grass;
    this.seed = seed;
    this.matcache = null;

    this.bladeCount = null;

    this.instanceFac = new GrassInstanceFactory(ctx, this.grass);
  }

  renderMaterial(rc: RenderContext) {
    if (this.field.valid() && this.grass.valid()) {
      const field = this.field.get();
      const sourceMat = this.getTransformationMatrix();
      field.drawPBR(sourceMat, rc);

      if (!this.matcache) {
        const center = vec3.create();
        const temp = vec3.create();

        
        this.matcachefloat = new Float32Array(36 * 128 * 16);
        this.normcachefloat = new Float32Array(36 * 128 * 9);
        let cur = 0;
        let cur_n = 0;
        // same for normals
        xorshift32_seed(this.seed);
        this.matcache = [];
        this.bladeCount = 0;
        for (let i = 0; i < 128; i++) {
          // pick a spot inside of our planes
          // +/- 11 - 25 out on y
          // -24 - 24 out on x
          // about 1m below origin
          center[0] = xorshift32_float() * 24 - 12;
          center[1] = 0;
          center[2] = (Math.pow(xorshift32_float(), 2.0) * 5.0 + 12.9) * (xorshift32_float() > 0.5 ? 1 : -1);
          const bladeCount = Math.floor(xorshift32_float() * 12 + 24);
          for (let j = 0; j < bladeCount; j++) {
            let grassmat = mat4.identity(mat4.create());
            mat4.translate(grassmat, grassmat, center);
            // choose a theta and an r
            // rotate shift by theta
            const theta = xorshift32_float() * Math.PI * 2;
            const r = xorshift32_float() * (GRASS_RADIUS_MAX - GRASS_RADIUS_MIN) + GRASS_RADIUS_MIN;
            temp[0] = Math.cos(theta) * r;
            temp[1] = 0;
            temp[2] = Math.sin(theta) * r;
            mat4.translate(grassmat, grassmat, temp);
            mat4.rotate(grassmat, grassmat, theta, GRASS_ROT_AXIS);
            mat4.scale(grassmat, grassmat, GRASS_SCALE);
            this.matcache.push(grassmat);

            for (let k = 0; k < 16; k++) {
              this.matcachefloat[cur++] = grassmat[k];
            }

            const norm = mat3.create();
            mat3.fromMat4(norm, grassmat);
            mat3.transpose(norm, norm);
            mat3.invert(norm, norm);

            for (let k = 0; k < 9; k++) {
              this.normcachefloat[cur_n++] = norm[k];
            }

            this.bladeCount++;
          }
        }
      }

      const parentMat = this.getTransformationMatrix();
      this.instanceFac.parentMat = parentMat;

      // this.instanceFac.drawManyInstanced(this.matcachefloat, this.normcachefloat, this.bladeCount, rc);
    }
  }
}