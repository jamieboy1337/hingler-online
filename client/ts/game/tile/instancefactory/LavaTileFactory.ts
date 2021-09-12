import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { Task } from "../../../../../ts/util/task/Task";
import { GameContext } from "../../../engine/GameContext";
import { GLTFScene } from "../../../engine/loaders/GLTFScene";
import { PBRInstanceFactory } from "../../../engine/model/PBRInstanceFactory";
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