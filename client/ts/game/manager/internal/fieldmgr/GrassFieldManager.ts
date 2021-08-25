import { Task } from "../../../../../../ts/util/task/Task";
import { xorshift32_float, xorshift32_seed } from "../../../../../../ts/util/Xorshift32";
import { GameContext } from "../../../../engine/GameContext";
import { PBRInstanceFactory } from "../../../../engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../engine/model/PBRModel";
import { GamePBRModel } from "../../../../engine/object/game/GamePBRModel";
import { CornField } from "../../../field/CornField";
import { FieldManager } from "../../FieldManager";

const grassFieldNames = [
  "grass0",
  "grass1",
];

const resourceNames = [
  "corn"
];

export class GrassFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private models: Array<Task<PBRModel>>;
  private resources: Array<Task<PBRInstanceFactory>>;
  constructor(ctx: GameContext) {
    this.seed = Math.floor(Math.random() * 4294967295);
    this.models = [];
    this.resources = [];
    this.ctx = ctx;

    for (let i = 0; i < grassFieldNames.length; i++) {
      this.models.push(new Task<PBRModel>());
    }

    for (let i = 0; i < resourceNames.length; i++) {
      this.resources.push(new Task<PBRInstanceFactory>());
    }

    ctx.getGLTFLoader().loadAsGLTFScene("../res/fieldgrass.glb")
      .then(scene => {
        for (let i = 0; i < grassFieldNames.length; i++) {
          this.models[i].resolve(scene.getPBRModel(grassFieldNames[i]));
        }

        for (let i = 0; i < resourceNames.length; i++) {
          this.resources[i].resolve(scene.getPBRInstanceFactory(resourceNames[i]));
        }
      })
  }

  getFieldModel(n: number) {
    // compute which model to spawn
    xorshift32_seed(this.seed + n);
    let prob = xorshift32_float();
    if (prob > 0.8) {
      return new CornField(this.ctx, this.models[1].getFuture(), this.resources[0].getFuture(), this.seed + 1);
    }

    return new GamePBRModel(this.ctx, this.models[0].getFuture());
  }

  setFieldSeed(n: number) {
    this.seed = n;
  }
}