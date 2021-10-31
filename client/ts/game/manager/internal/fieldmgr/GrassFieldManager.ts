import { GameContext } from "../../../../../../hingler-party/client/ts/engine/GameContext";
import { PBRModel } from "../../../../../../hingler-party/client/ts/engine/model/PBRModel";
import { GameObject } from "../../../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../../../../../../hingler-party/client/ts/engine/object/game/GamePBRModel";
import { Task } from "../../../../../../ts/util/task/Task";
import { xorshift32_seed, xorshift32_float } from "../../../../../../ts/util/Xorshift32";
import { FieldManager } from "../../FieldManager";


const grassFieldNames = [
  "field_grass",
  "field_rock",
  "tile_grass",
  "field_pit"
];

export class GrassFieldManager implements FieldManager {
  private ctx: GameContext;
  private seed: number;
  private models: Array<Task<PBRModel>>;
  private tilemodel: Task<PBRModel>;

  private width: number;
  constructor(ctx: GameContext, width: number) {
    this.seed = Math.floor(Math.random() * 4294967295);
    this.models = [];
    this.ctx = ctx;
    this.width = width;

    this.tilemodel = new Task();

    for (let i = 0; i < grassFieldNames.length; i++) {
      this.models.push(new Task<PBRModel>());
    }

    let loader = ctx.getGLTFLoader();

    loader.loadAsGLTFScene("../res/grassworld_new.glb")
      .then(scene => {
        for (let i = 0; i < grassFieldNames.length; i++) {
          this.models[i].resolve(scene.getPBRModel(grassFieldNames[i]));
        }
      });

    loader.loadAsGLTFScene("../res/grassworld.glb")
      .then(scene => {
        this.tilemodel.resolve(scene.getPBRModel(0))
      });
  }

  getFieldModel(n: number) {
    let origin = new GameObject(this.ctx);
    // dummy number, avoid this behavior for now
    if (n === -15) {
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
      
      if (prob > 0.8) {
        let rock = new GamePBRModel(this.ctx, this.models[3].getFuture());
        rock.setPosition(0, 0, 0);
        origin.addChild(rock);
      } else {
        let fieldNear = new GamePBRModel(this.ctx, this.models[0].getFuture());
        let fieldFar = new GamePBRModel(this.ctx, this.models[0].getFuture());
        fieldNear.setPosition(-12, 0, 0);
        fieldFar.setPosition(12, 0, 0);
  
        origin.addChild(fieldNear);
        origin.addChild(fieldFar);
      }

    }

    let tileNear = new GamePBRModel(this.ctx, this.models[2].getFuture());
    let tileFar  = new GamePBRModel(this.ctx, this.models[2].getFuture());
    tileNear.setPosition(-12, 0, 0);
    tileFar.setPosition(12, 0, 0);
    origin.addChild(tileNear);
    origin.addChild(tileFar);

    return origin;
  }

  setFieldSeed(n: number) {
    this.seed = n;
  }
}