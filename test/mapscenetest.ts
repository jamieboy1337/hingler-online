import { GameWorldManagerSinglePlayer } from "../client/ts/game/GameWorldManagerSinglePlayer";
import { GameContext } from "../hingler-party/client/ts/engine/GameContext";
import { Scene } from "../hingler-party/client/ts/engine/object/scene/Scene";

export class MapSceneTest extends Scene {
  async initialize(ctx: GameContext) : Promise<void> {
    ctx.setContextVar("SHADER_FXAA_QUALITY", 2, { shaderInteger: true });
    let root = this.getGameObjectRoot();
    const player = await ctx.getGLTFLoader().loadAsGLTFScene("../res/chewingcharacter.glb");
    root.addChild(new GameWorldManagerSinglePlayer(ctx, player.getPBRModel(0)));
  }
}