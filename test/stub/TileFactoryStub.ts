import { GameContext } from "../../client/ts/engine/GameContext";
import { GLTFScene } from "../../client/ts/engine/loaders/GLTFScene";
import { PBRInstance } from "../../client/ts/engine/model/PBRInstance";
import { PBRInstanceFactory } from "../../client/ts/engine/model/PBRInstanceFactory";
import { GameTile } from "../../client/ts/game/tile/GameTile";
import { CrateTile } from "../../client/ts/game/tile/generic/CrateTile";
import { ExplosionTile } from "../../client/ts/game/tile/generic/ExplosionTile";
import { ExplosionInstanceFactory } from "../../client/ts/game/tile/instancefactory/ExplosionInstanceFactory";
import { ExplosionInstance } from "../../client/ts/game/tile/instancefactory/instance/ExplosionInstance";
import { TileFactory } from "../../client/ts/game/tile/TileFactory";
import { Future } from "../../ts/util/task/Future";
import { Task } from "../../ts/util/task/Task";

export class TileFactoryStub implements TileFactory {
  ctx: GameContext;
  scenePromise: Task<GLTFScene>;
  crateFactory: PBRInstanceFactory;
  explosionFactory: ExplosionInstanceFactory;
  constructor(ctx: GameContext) {
    this.ctx = ctx;
    // create instances for all desired tiles
    this.crateFactory = null;
    this.explosionFactory = null;
    this.scenePromise = new Task();
    ctx.getGLTFLoader().loadAsGLTFScene("../res/crate3d.glb").then(this.configureCrateFactory.bind(this));
  }

  private configureCrateFactory(scene: GLTFScene) {
    // all factories will exist after scene promise is resolved
    this.crateFactory = scene.getPBRInstanceFactory("Cube");
    this.explosionFactory = new ExplosionInstanceFactory(this.ctx, scene.getInstancedModel("Sphere"));
    this.scenePromise.resolve(scene);
  }

  getTileFromID(id: number) : GameTile {
    
    if (id === 0) {
      // air
      return null;
    } else {
      switch (id) {
        case 1:
          return this.getCrate();
        case 2:
          return this.getExplosion();
      }
    }

    return null;
  }

  private getCrate() {
    let loadtask : Task<PBRInstance> = new Task(); 
    if (this.scenePromise.getFuture().valid()) {
      loadtask.resolve(this.crateFactory.getInstance());
    } else {
      this.scenePromise.future.wait().then((_) => {
        loadtask.resolve(this.crateFactory.getInstance());
      })
    }

    return new CrateTile(this.ctx, loadtask.getFuture());
  }

  private getExplosion() {
    let loadtask : Task<ExplosionInstance> = new Task();
    if (this.scenePromise.getFuture().valid()) {
      loadtask.resolve(this.explosionFactory.getInstance());
    } else {
      this.scenePromise.future.wait().then((_) => {
        loadtask.resolve(this.explosionFactory.getInstance());
      })
    }

    return new ExplosionTile(this.ctx, loadtask.getFuture());
  }
}