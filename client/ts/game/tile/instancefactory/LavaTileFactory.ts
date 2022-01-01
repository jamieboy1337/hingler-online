import { Task } from "@hingler-party/ts/util/task/Task";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { GLTFScene } from "../../../../../hingler-party/client/ts/engine/loaders/GLTFScene";
import { PBRInstanceFactory } from "../../../../../hingler-party/client/ts/engine/model/PBRInstanceFactory";
import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { GameTile } from "../GameTile";
import { WallTile } from "../generic/WallTile";
import { TileFactory } from "../TileFactory";
import { TileID } from "../TileID";

export class LavaTileFactory extends TileFactoryStub implements TileFactory {
  lavaCrateFactory: Task<PBRInstanceFactory>;

  constructor(ctx: GameContext) {
    super(ctx);
    this.lavaCrateFactory = new Task();
    ctx.getGLTFLoader().loadAsGLTFScene("../res/crate3d_lava.glb").then(this.configureLavaFactory.bind(this));
  }

  private configureLavaFactory(scene: GLTFScene) {
    this.lavaCrateFactory.resolve(scene.getPBRInstanceFactory("wall_lava"));
  }

  getTileFromID(id: number) : GameTile {
    if (id === TileID.WALL) {
      return new WallTile(this.ctx, this.loadInstanceFromFactory(this.lavaCrateFactory.getFuture()));
    }

    return super.getTileFromID(id);
  }

  private getLavaCrate() {
    
  }
}