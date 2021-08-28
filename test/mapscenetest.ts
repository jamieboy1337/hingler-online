import { GameContext } from "../client/ts/engine/GameContext";
import { Scene } from "../client/ts/engine/object/scene/Scene";
import { GameWorldManagerSinglePlayer } from "../client/ts/game/GameWorldManagerSinglePlayer";

export class MapSceneTest extends Scene {
  async initialize(ctx: GameContext) : Promise<void> {
    let root = this.getGameObjectRoot();
    root.addChild(new GameWorldManagerSinglePlayer(ctx));
  }
}