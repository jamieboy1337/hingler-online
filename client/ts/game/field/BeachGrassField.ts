import { mat4, ReadonlyMat4, vec3 } from "gl-matrix";
import { GameContext } from "../../../../hingler-party/client/ts/engine/GameContext";
import { PBRInstanceFactory } from "../../../../hingler-party/client/ts/engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { RenderContext } from "../../../../hingler-party/client/ts/engine/render/RenderContext";
import { xorshift32, xorshift32_float } from "../../../../hingler-party/ts/util/Xorshift32";
import { Future } from "../../../../ts/util/task/Future";
import { xorshift32_seed } from "../../../../ts/util/Xorshift32";

const GRASS_RADIUS_MIN = 0.8;
const GRASS_RADIUS_MAX = 1.1;
const GRASS_SCALE_CONST = 0.25;

const GRASS_ROT_AXIS : [number, number, number] = [0, 1, 0];
const GRASS_SCALE    : [number, number, number] = [GRASS_SCALE_CONST, GRASS_SCALE_CONST, GRASS_SCALE_CONST];

export class BeachGrassField extends GameObject {
  private field: Future<PBRModel>;
  private grass: Future<PBRInstanceFactory>;
  private seed: number;
  private matcache: Array<ReadonlyMat4>;
  // arrange normally
  // ideally it'll fade out when we get to the hill
  constructor(ctx: GameContext, field: Future<PBRModel>, grass: Future<PBRInstanceFactory>, seed: number) {
    super(ctx);
    this.field = field;
    this.grass = grass;
    this.seed = seed;
    this.matcache = null;
  }

  renderMaterial(rc: RenderContext) {
    if (this.field.valid() && this.grass.valid()) {
      const field = this.field.get();
      const blade = this.grass.get().getInstance();
      const sourceMat = this.getTransformationMatrix();
      field.drawPBR(sourceMat, rc);

      if (!this.matcache) {
        const center = vec3.create();
        const temp = vec3.create();
        xorshift32_seed(this.seed);
        this.matcache = [];
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
          }
        }
      }

      const mattemp = mat4.create();
      for (let mat of this.matcache) {
        mat4.copy(mattemp, mat);
        // come up with a way to draw blades of grass more quickly
        // i think this mat mul takes up a lot of cpu time
        // do the multiplication in-shader instead of on cpu, create a custom inst for it
        mat4.mul(mattemp, sourceMat, mattemp);
        blade.modelMat = mattemp;
        blade.draw(rc);
      }
    }
  }
}