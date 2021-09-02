import { Task } from "../../../../../../ts/util/task/Task";
import { xorshift32_float, xorshift32_seed } from "../../../../../../ts/util/Xorshift32";
import { GameContext } from "../../../../engine/GameContext";
import { PBRInstanceFactory } from "../../../../engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../engine/model/PBRModel";
import { GameObject } from "../../../../engine/object/game/GameObject";
import { GamePBRModel } from "../../../../engine/object/game/GamePBRModel";
import { CornField } from "../../../field/CornField";
import { FieldManager } from "../../FieldManager";

const grassFieldNames = [
  "grass0",
  "grass1",
  "grass-1"
];

const resourceNames = [
  "corn"
];

export class GrassFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private models: Array<Task<PBRModel>>;
  private resources: Array<Task<PBRInstanceFactory>>;
  private tilemodel: Task<PBRModel>;

  private width: number;
  constructor(ctx: GameContext, width: number) {
    this.seed = Math.floor(Math.random() * 4294967295);
    this.models = [];
    this.resources = [];
    this.ctx = ctx;
    this.width = width;

    this.tilemodel = new Task();

    for (let i = 0; i < grassFieldNames.length; i++) {
      this.models.push(new Task<PBRModel>());
    }

    for (let i = 0; i < resourceNames.length; i++) {
      this.resources.push(new Task<PBRInstanceFactory>());
    }

    let loader = ctx.getGLTFLoader();

    loader.loadAsGLTFScene("../res/fieldgrass.glb")
      .then(scene => {
        for (let i = 0; i < grassFieldNames.length; i++) {
          this.models[i].resolve(scene.getPBRModel(grassFieldNames[i]));
        }

        for (let i = 0; i < resourceNames.length; i++) {
          this.resources[i].resolve(scene.getPBRInstanceFactory(resourceNames[i]));
        }
      });

    loader.loadAsGLTFScene("../res/grassworld.glb")
      .then(scene => {
        this.tilemodel.resolve(scene.getPBRModel(0))
      });
  }

  getFieldModel(n: number) {
    let origin = new GameObject(this.ctx);
    if (n === 0) {
      let child = new GamePBRModel(this.ctx, this.models[2].getFuture());
      origin.addChild(child);
      child.setPosition(0, 0, -this.width);
      let tile = new GamePBRModel(this.ctx, this.tilemodel.getFuture());
      tile.setPosition(12, 0, 0);
      origin.addChild(tile);
      return origin;
    } else {
      xorshift32_seed(this.seed + n);
      let prob = xorshift32_float();
      let modelTop : GameObject;
      let modelBot : GameObject;
      if (prob > 0.8) {
        modelTop = new CornField(this.ctx, this.models[1].getFuture(), this.resources[0].getFuture(), this.seed + 1);
        modelBot = new CornField(this.ctx, this.models[1].getFuture(), this.resources[0].getFuture(), this.seed + 1);
      } else {
        modelTop = new GamePBRModel(this.ctx, this.models[0].getFuture());
        modelBot = new GamePBRModel(this.ctx, this.models[0].getFuture());
      }

      modelTop.setPosition(0, 0, -this.width);
      modelBot.setPosition(0, 0, this.width);
      modelBot.setRotationEuler(0, 180, 0);

      origin.addChild(modelTop);
      origin.addChild(modelBot);
    }

    let tileNear = new GamePBRModel(this.ctx, this.tilemodel.getFuture());
    let tileFar  = new GamePBRModel(this.ctx, this.tilemodel.getFuture());
    origin.addChild(tileNear);
    origin.addChild(tileFar);
    tileNear.setPosition(-12, 0, 0);
    tileFar.setPosition(12, 0, 0);

    return origin;
  }

  setFieldSeed(n: number) {
    this.seed = n;
  }
}