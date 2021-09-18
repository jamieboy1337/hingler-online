import { Task } from "../../../../../../ts/util/task/Task";
import { GameContext } from "../../../../engine/GameContext";
import { GLTFScene } from "../../../../engine/loaders/GLTFScene";
import { PBRModel } from "../../../../engine/model/PBRModel";
import { GameObject } from "../../../../engine/object/game/GameObject";
import { GamePBRModel } from "../../../../engine/object/game/GamePBRModel";
import { FieldManager } from "../../FieldManager";

const mountainResourceNames = [
  "field_beach",
  "tile_beach",
  "bridge",
  "water",
  "mountain"
];

export class MountainFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private models: Array<Task<PBRModel>>;

  constructor(ctx: GameContext, width: number) {
    this.ctx = ctx;
    this.seed = Math.floor(Math.random() * 4294967295);
    this.models = [];
    for (let i = 0; i < mountainResourceNames.length; i++) {
      this.models.push(new Task());
    }

    ctx.getGLTFLoader().loadAsGLTFScene("../res/mountainworld.glb")
      .then(this.loadAllModels.bind(this));
  }

  private getModel(ind: number) {
    return new GamePBRModel(this.ctx, this.models[ind].getFuture());
  }

  getFieldModel(n: number) {
    let origin = new GameObject(this.ctx);
    if (n === 0) {
      let tileNear = this.getModel(1);
      let tileFar = this.getModel(1);
      let field = this.getModel(0);

      origin.addChild(tileNear);
      origin.addChild(tileFar);
      origin.addChild(field);

      tileNear.setPosition(-12, 0, 0);
      tileFar.setPosition(12, 0, 0);
      field.setPosition(0, 0, 0);
    } else if (n === 1) {
      let tileNear = this.getModel(2);
      let tileFar = this.getModel(4);
      let water = this.getModel(3);
      origin.addChild(tileNear);
      origin.addChild(tileFar);
      origin.addChild(water);
      tileNear.setPosition(-12, 0, 0);
      tileFar.setPosition(12, 0, 0);
      water.setPosition(-12, -24, 0);
    } else {
      let tileNear = this.getModel(4);
      let tileFar = this.getModel(4);
      origin.addChild(tileNear);
      origin.addChild(tileFar);
      tileNear.setPosition(-12, 0, 0);
      tileFar.setPosition(12, 0, 0);
    }

    return origin;
  }

  setFieldSeed(seed: number) {
    this.seed = seed;
  }

  private loadAllModels(scene: GLTFScene) {
    for (let i = 0; i < mountainResourceNames.length; i++) {
      this.models[i].resolve(scene.getPBRModel(mountainResourceNames[i]));
    }
  }
}