import { GameContext } from "../client/ts/engine/GameContext";
import { GameCamera } from "../client/ts/engine/object/game/GameCamera";
import { SpotLightObject } from "../client/ts/engine/object/game/light/SpotLightObject";
import { Scene } from "../client/ts/engine/object/scene/Scene";
import { MapManager } from "../client/ts/game/MapManager";
import { GameConnectionManagerStub } from "./stub/GameConnectionManagerStub";

class DummyCamera extends GameCamera {
  time: number;
  constructor(ctx: GameContext) {
    super(ctx);
    this.time = 0;
  }

  update() {
    this.time += this.getContext().getDelta();
    this.setPosition(Math.sin(this.time * 6) * 4, 35, 60);
    this.lookAt(0, 0, 0);
  }
}

export class MapSceneTest extends Scene {
  initialize(ctx: GameContext) {
    // create a camera and point it at 0
    let cam = new DummyCamera(ctx);
    cam.setPosition(0, 35, 60);
    cam.fov = 25;
    cam.lookAt(0, 0, 0);
    // create our map manager, construct w a dummy

    let conn = new GameConnectionManagerStub();
    let mapmgr = new MapManager(ctx, conn);
    let root = this.getGameObjectRoot();
    root.addChild(mapmgr);
    root.addChild(cam);
    cam.setAsActive();

    let spot = new SpotLightObject(ctx);
    spot.setPosition(-20, 30, 45);
    spot.fov = 45;
    spot.falloffRadius = 0.4;
    spot.atten_const = 1;
    spot.atten_linear = 0;
    spot.atten_quad = 0;
    spot.intensity = 1;
    spot.color = [1, 1, 1, 1];
    
    spot.near = 0.1;
    spot.far = 1000.0;

    spot.setShadowDims(2048, 2048);
    spot.setShadows(true);
    spot.lookAt(0, 0, 0);

    root.addChild(spot);
  }
}