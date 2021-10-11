import { GameContext } from "../../engine/GameContext";
import { Scene } from "../../engine/object/scene/Scene";
import { SplashScreenObject } from "./SplashScreenObject";

export class SplashScreenScene extends Scene {
  // super simple
  // we'll set up the bg as a component which can be faded in and out
  // that component will handle scene loading
  // first touch skips fade in anim (if playing, otherwise skip)
  // second touch starts game

  // 1s fade in
  // lets jump straight into it for now

  // todo: add pause screen for main game
  // come up with some way to pass a distinct time value down the hierarchy (just a game object whose delta we can fetch?)
  // use that time value everywhere delta is used
  async initialize(ctx: GameContext) {
    let root = this.getGameObjectRoot();
    root.addChild(new SplashScreenObject(ctx));
  }
}