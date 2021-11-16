import { GameContext } from "../../../../../../hingler-party/client/ts/engine/GameContext";
import { GLTFScene } from "../../../../../../hingler-party/client/ts/engine/loaders/GLTFScene";
import { PBRInstanceFactory } from "../../../../../../hingler-party/client/ts/engine/model/PBRInstanceFactory";
import { PBRModel } from "../../../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../../../../../../hingler-party/client/ts/engine/object/game/GamePBRModel";
import { Task } from "../../../../../../hingler-party/ts/util/task/Task";
import { BeachGrassField } from "../../../field/BeachGrassField";
import { FieldManager } from "../../FieldManager";

const bridgeFieldNames = [
  "field_beach_grass",
  "field_beach_hill"
];

const bridgeTileNames = [
  "tile_beach",
  "tile_bridge"
];

const grassResource = "grass_blade";

export class BridgeFieldManager implements FieldManager {
  private ctx: GameContext;
  private fieldmodels: Array<Task<PBRModel>>;
  private tilemodels: Array<Task<PBRModel>>;
  private grassBlade: Task<PBRInstanceFactory>;

  constructor(ctx: GameContext, width: number) {
    this.ctx = ctx;
    this.fieldmodels = [];
    this.tilemodels = [];
    this.grassBlade = new Task();
    
    for (let i = 0; i < bridgeFieldNames.length; i++) {
      this.fieldmodels.push(new Task());
    }

    for (let i = 0; i < bridgeTileNames.length; i++) {
      this.tilemodels.push(new Task());
    }

    const loader = ctx.getGLTFLoader();
    loader.loadAsGLTFScene("../res/bridgeworld.glb")
    .then(this.loadAllModels.bind(this));
  }

  getFieldModel(n: number) {
    const origin = new GameObject(this.ctx);
    let tileNear : GameObject;
    let tileFar: GameObject;
    let field: GameObject;
    if (n < 3) {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[0].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[0].getFuture());
    } else {
      tileNear = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
      tileFar = new GamePBRModel(this.ctx, this.tilemodels[1].getFuture());
    }

    if (n < 2) {
      field = new BeachGrassField(this.ctx, this.fieldmodels[0].getFuture(), this.grassBlade.getFuture(), n);
    } else if (n < 3) {
      field = new GamePBRModel(this.ctx, this.fieldmodels[1].getFuture());
    } else {
      field = null;
    }

    origin.addChild(tileNear);
    origin.addChild(tileFar);
    tileNear.setPosition(-12, 0, 0);
    tileFar.setPosition(12, 0, 0);
    if (field !== null) {
      origin.addChild(field);
      field.setPosition(0, 0, 0);
    }

    return origin;
  }

  setFieldSeed(n: number) {
    // nop
  }

  private loadAllModels(scene: GLTFScene) {
    for (let i = 0; i < bridgeFieldNames.length; i++) {
      this.fieldmodels[i].resolve(scene.getPBRModel(bridgeFieldNames[i]));
    }

    for (let i = 0; i < bridgeTileNames.length; i++) {
      this.tilemodels[i].resolve(scene.getPBRModel(bridgeTileNames[i]));
    }

    this.grassBlade.resolve(scene.getPBRInstanceFactory(grassResource));
  }
}