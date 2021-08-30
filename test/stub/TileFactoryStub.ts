import { GameContext } from "../../client/ts/engine/GameContext";
import { GLTFScene } from "../../client/ts/engine/loaders/GLTFScene";
import { PBRModelImpl } from "../../client/ts/engine/loaders/internal/PBRModelImpl";
import { PBRInstance } from "../../client/ts/engine/model/PBRInstance";
import { PBRInstanceFactory } from "../../client/ts/engine/model/PBRInstanceFactory";
import { PBRModel } from "../../client/ts/engine/model/PBRModel";
import { GamePBRModel } from "../../client/ts/engine/object/game/GamePBRModel";
import { GameTile } from "../../client/ts/game/tile/GameTile";
import { BombTile } from "../../client/ts/game/tile/generic/BombTile";
import { CrateTile } from "../../client/ts/game/tile/generic/CrateTile";
import { ExplosionTile } from "../../client/ts/game/tile/generic/ExplosionTile";
import { KnightTile } from "../../client/ts/game/tile/generic/KnightTile";
import { ModelTile } from "../../client/ts/game/tile/generic/ModelTile";
import { ExplosionInstanceFactory } from "../../client/ts/game/tile/instancefactory/ExplosionInstanceFactory";
import { ExplosionInstance } from "../../client/ts/game/tile/instancefactory/instance/ExplosionInstance";
import { TileFactory } from "../../client/ts/game/tile/TileFactory";
import { TileID } from "../../client/ts/game/tile/TileID";
import { Future } from "../../ts/util/task/Future";
import { Task } from "../../ts/util/task/Task";

export class TileFactoryStub implements TileFactory {
  ctx: GameContext;
  scenePromise: Task<GLTFScene>;
  crateFactory: PBRInstanceFactory;
  explosionFactory: ExplosionInstanceFactory;
  wallFactory: PBRInstanceFactory;
  bombFactory: PBRInstanceFactory;
  knight: PBRInstanceFactory;
  constructor(ctx: GameContext) {
    this.ctx = ctx;
    // create instances for all desired tiles
    this.crateFactory = null;
    this.explosionFactory = null;
    this.knight = null;
    this.scenePromise = new Task();
    ctx.getGLTFLoader().loadAsGLTFScene("../res/crate3d.glb").then(this.configureCrateFactory.bind(this));
  }

  private configureCrateFactory(scene: GLTFScene) {
    // all factories will exist after scene promise is resolved
    this.crateFactory = scene.getPBRInstanceFactory("Cube");
    this.explosionFactory = new ExplosionInstanceFactory(this.ctx, scene.getInstancedModel("Sphere"));
    this.wallFactory = scene.getPBRInstanceFactory("Cube.001");
    this.bombFactory = scene.getPBRInstanceFactory("Bomb");
    this.knight = (scene.getPBRInstanceFactory("knight"));
    this.scenePromise.resolve(scene);
  }

  getTileFromID(id: number) : GameTile {
    
    if (id === 0) {
      // air
      return null;
    } else {
      switch (id) {
        case TileID.CRATE:
          return this.getCrate();
        case TileID.EXPLOSION:
          return this.getExplosion();
        case TileID.WALL:
          return this.getWall();
        case TileID.BOMB:
          return this.getBomb();
        case TileID.ENEMY_KNIGHT:
          return this.getKnight();
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

  private getWall() {
    let loadtask : Task<PBRInstance> = new Task(); 
    if (this.scenePromise.getFuture().valid()) {
      loadtask.resolve(this.wallFactory.getInstance());
    } else {
      this.scenePromise.future.wait().then((_) => {
        loadtask.resolve(this.wallFactory.getInstance());
      })
    }

    return new CrateTile(this.ctx, loadtask.getFuture());
  }

  private getBomb() {
    let loadtask : Task<PBRInstance> = new Task();
    if (this.scenePromise.getFuture().valid()) {
      loadtask.resolve(this.bombFactory.getInstance());
    } else {
      this.scenePromise.future.wait().then((_) => {
        loadtask.resolve(this.bombFactory.getInstance());
      });
    }

    return new BombTile(this.ctx, loadtask.getFuture());
  }

  private getKnight() {
    let loadtask : Task<PBRInstance> = new Task();
    if (this.scenePromise.getFuture().valid()) {
      loadtask.resolve(this.knight.getInstance());
    } else {
      this.scenePromise.future.wait().then((_) => {
        loadtask.resolve(this.knight.getInstance());
      });
    }

    return new KnightTile(this.ctx, loadtask.getFuture());
  }
}