import { GameContext } from "../../../../../../hingler-party/client/ts/engine/GameContext";
import { GLTFScene } from "../../../../../../hingler-party/client/ts/engine/loaders/GLTFScene";
import { PBRModel } from "../../../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../../../../../../hingler-party/client/ts/engine/object/game/GamePBRModel";
import { Task } from "../../../../../../ts/util/task/Task";
import { FieldManager } from "../../FieldManager";

const beachTileNames = [
  "tile_grass",
  "tile_grass_beach",
  "tile_beach"
];

const beachFieldNames = [
  "field_grass_beach",
  "field_beach"
];

const beachResourceNames = [
  "bucket",
  "sand_pile",
  "sandcastle",
  "umbrella"
];

export class BeachFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private tilemodels: Array<Task<PBRModel>>;
  private fieldmodels: Array<Task<PBRModel>>;
  private resources: Array<Task<PBRModel>>;

  constructor(ctx: GameContext, width: number) {
    this.ctx = ctx;
    this.seed = Math.floor(Math.random() * 4294967295);
    this.tilemodels = [];
    this.fieldmodels = [];
    this.resources = [];
    for (let i = 0; i < beachTileNames.length; i++) {
      this.tilemodels.push(new Task());
    }

    for (let i = 0; i < beachFieldNames.length; i++) {
      this.fieldmodels.push(new Task());
    }

    for (let i = 0; i < beachResourceNames.length; i++) {
      this.resources.push(new Task());
    }

    let loader = ctx.getGLTFLoader();
    
    loader.loadAsGLTFScene("../res/beachworld.glb")
    .then(this.loadAllModels.bind(this));
  }

  getFieldModel(n: number) {
    let origin = new GameObject(this.ctx);
    let tileNear : GameObject;
    let tileFar : GameObject;
    let field : GameObject;
    if (n === 0) {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[0].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
      field = new GamePBRModel(this.ctx, this.fieldmodels[0].getFuture());
    } else {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[2].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[2].getFuture());
      field = new GamePBRModel(this.ctx, this.fieldmodels[1].getFuture());
    }

    origin.addChild(tileNear);
    origin.addChild(tileFar);
    origin.addChild(field);
    tileNear.setPosition(-12, 0, 0);
    tileFar.setPosition(12, 0, 0);
    field.setPosition(0, 0, 0);

    return origin;
  }

  private loadAllModels(scene: GLTFScene) {
    for (let i = 0; i < beachTileNames.length; i++) {
      this.tilemodels[i].resolve(scene.getPBRModel(beachTileNames[i]));
    }

    for (let i = 0; i < beachFieldNames.length; i++) {
      this.fieldmodels[i].resolve(scene.getPBRModel(beachFieldNames[i]));
    }

    for (let i = 0; i < beachResourceNames.length; i++) {
      this.resources[i].resolve(scene.getPBRModel(beachResourceNames[i]));
    }
  }

  setFieldSeed(seed: number) {
    // nop for now
  }
}