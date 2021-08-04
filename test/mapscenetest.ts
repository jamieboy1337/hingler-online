import { GameContext } from "../client/ts/engine/GameContext";
import { GameCamera } from "../client/ts/engine/object/game/GameCamera";
import { GameObject } from "../client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../client/ts/engine/object/game/GamePBRModel";
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
  }
}

class DummyEmpty extends GameObject {
  time: number;
  rot: boolean;
  constructor(ctx: GameContext, rot?: boolean) {
    super(ctx);
    this.time = 0;
    this.rot = (!!rot);
  }

  update() {
    this.time += this.getContext().getDelta();
    this.setRotationEuler(0, 50.0 * this.time * (this.rot ? 1 : -0.8502934), 0);
  }
}

export class MapSceneTest extends Scene {
  initialize(ctx: GameContext) {
    // create a camera and point it at 0
    let cam = new DummyCamera(ctx);
    cam.setPosition(0, 35, 60);
    cam.fov = 18;
    cam.lookAt(0, 0, 0);
    // create our map manager, construct w a dummy

    let conn = new GameConnectionManagerStub();
    let mapmgr = new MapManager(ctx, conn);
    let rot = new DummyEmpty(ctx, true);
    rot.setPosition(0, 0, 0);
    cam.lookAt(0, 0, 0);
    let root = this.getGameObjectRoot();

    root.addChild(mapmgr);
    rot.addChild(cam);
    root.addChild(rot);
    cam.setAsActive();

    let rot_two = new DummyEmpty(ctx);
    // rot_two.setScale(1, 1, -1);
    rot_two.setPosition(0, 0, 0);
    
    let spot = new SpotLightObject(ctx);
    spot.setPosition(-20, 30, 45);
    spot.fov = 31;
    spot.falloffRadius = 0.2;
    spot.atten_const = 1;
    spot.atten_linear = 0;
    spot.atten_quad = 0;
    spot.intensity = 2.0;
    spot.color = new Float32Array([1, 1, 1, 1]);
    
    spot.near = 0.1;
    spot.far = 1000.0;

    spot.setShadowDims(1024, 1024);
    spot.setShadows(true);
    spot.lookAt(0, 0, 0);

    // let chewingcharacter = new GamePBRModel(ctx, "../res/chewingcharacter.glb");
    // chewingcharacter.setPosition(0, 4, 0);
    // root.addChild(chewingcharacter);

    rot_two.addChild(spot);
    root.addChild(rot_two);
  }
}