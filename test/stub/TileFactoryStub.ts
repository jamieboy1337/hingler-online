import { GameContext } from "../../client/ts/engine/GameContext";
import { GLTFScene } from "../../client/ts/engine/loaders/GLTFScene";
import { PBRInstance } from "../../client/ts/engine/model/PBRInstance";
import { PBRInstanceFactory } from "../../client/ts/engine/model/PBRInstanceFactory";
import { GameTile } from "../../client/ts/game/tile/GameTile";
import { CrateTile } from "../../client/ts/game/tile/generic/CrateTile";
import { TileFactory } from "../../client/ts/game/tile/TileFactory";
import { Future } from "../../ts/util/task/Future";
import { Task } from "../../ts/util/task/Task";

export class TileFactoryStub implements TileFactory {
  ctx: GameContext;
  scenePromise: Task<GLTFScene>;
  crateFactory: PBRInstanceFactory;
  constructor(ctx: GameContext) {
    this.ctx = ctx;
    // create instances for all desired tiles
    this.crateFactory = null;
    this.scenePromise = new Task();
    ctx.getGLTFLoader().loadAsGLTFScene("../res/crate.glb").then(this.configureCrateFactory.bind(this));
  }

  private configureCrateFactory(scene: GLTFScene) {
    // all factories will exist after scene promise is resolved
    this.crateFactory = scene.getPBRInstanceFactory(0);
    this.scenePromise.resolve(scene);
  }

  getTileFromID(id: number) : GameTile {
    let loadtask : Task<PBRInstance> = new Task(); 
    if (id === 0) {
      // air
      return null;
    } else {
      
      if (this.scenePromise.getFuture().valid()) {
        loadtask.resolve(this.crateFactory.getInstance());
      } else {
        this.scenePromise.future.wait().then((_) => {
          loadtask.resolve(this.crateFactory.getInstance());
        })
      }

      return new CrateTile(this.ctx, loadtask.getFuture());
    }
  }
}