import { GameWorldManagerSinglePlayer } from "../client/ts/game/GameWorldManagerSinglePlayer";
import { GameContext } from "../hingler-party/client/ts/engine/GameContext";
import { Scene } from "../hingler-party/client/ts/engine/object/scene/Scene";

export class MapSceneTest extends Scene {
  async initialize(ctx: GameContext) : Promise<void> {
    let root = this.getGameObjectRoot();
    root.addChild(new GameWorldManagerSinglePlayer(ctx));
  }
}