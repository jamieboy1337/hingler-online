import { Task } from "@hingler-party/ts/util/task/Task";
import { GameContext } from "../../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRModel } from "../../../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../../../../../../hingler-party/client/ts/engine/object/game/GamePBRModel";
import { FieldManager } from "../../FieldManager";

const lavaFloorNames = [
  "grass_to_lava",
  "lava"
];

export class LavaFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private tilemodels: Array<Task<PBRModel>>;

  private width: number;

  constructor(ctx: GameContext, width: number) {
    this.seed = Math.floor(Math.random() * 4294967295);
    this.tilemodels = [];
    for (let i = 0; i < lavaFloorNames.length; i++) {
      this.tilemodels.push(new Task());
    }

    let loader = ctx.getGLTFLoader();

    loader.loadAsGLTFScene("../res/lavaworld.glb")
    .then(scene => {
      for (let i = 0; i < lavaFloorNames.length; i++) {
        this.tilemodels[i].resolve(scene.getPBRModel(lavaFloorNames[i]));
      }
    })
  }

  getFieldModel(n: number) {
    let origin = new GameObject(this.ctx);
    let tileNear : GameObject;
    let tileFar : GameObject;
    if (n === 0) {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[0].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
    } else {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
    }

    origin.addChild(tileNear);
    origin.addChild(tileFar);
    tileNear.setPosition(-12, 0, 0);
    tileFar.setPosition(12, 0, 0);

    return origin;
  }

  setFieldSeed(seed: number) {
    this.seed = seed;
  }
}