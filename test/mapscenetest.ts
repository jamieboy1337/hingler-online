import { GameContext } from "../client/ts/engine/GameContext";
import { GameCamera } from "../client/ts/engine/object/game/GameCamera";
import { GameObject } from "../client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../client/ts/engine/object/game/GamePBRModel";
import { AmbientLightObject } from "../client/ts/engine/object/game/light/AmbientLightObject";
import { SpotLightObject } from "../client/ts/engine/object/game/light/SpotLightObject";
import { Scene } from "../client/ts/engine/object/scene/Scene";
import { GameConnectionManagerSinglePlayer } from "../client/ts/game/GameConnectionManagerSinglePlayer";
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
    // this.setRotationEuler(0, 50.0 * this.time * (this.rot ? 1 : -0.8502934), 0);
  }
}

export class MapSceneTest extends Scene {
  async initialize(ctx: GameContext) : Promise<void> {
    // create a camera and point it at 0
    let cam = new DummyCamera(ctx);
    cam.setPosition(0, 70, 32);
    cam.fov = 22;
    cam.far = 100.0;
    cam.lookAt(0, 0, 0);
    // create our map manager, construct w a dummy

    let conn = new GameConnectionManagerSinglePlayer(ctx);
    let mapmgr = new MapManager(ctx, conn);
    let rot = new DummyEmpty(ctx, true);
    rot.setPosition(0, 0, 0);
    cam.lookAt(0, 0, 0);
    let root = this.getGameObjectRoot();

    root.addChild(conn);
    root.addChild(mapmgr);
    rot.addChild(cam);
    root.addChild(rot);
    cam.setAsActive();

    let rot_two = new DummyEmpty(ctx);
    // rot_two.setScale(1, 1, -1);
    rot_two.setPosition(0, 0, 0);
    
    let spot = new SpotLightObject(ctx);
    spot.setPosition(-200, 400, 225);
    spot.fov = 7.5;
    spot.near = 100.0;
    spot.far = 10000.0;
    spot.falloffRadius = 0.2;
    spot.atten_const = 1;
    spot.atten_linear = 0;
    spot.atten_quad = 0;
    spot.intensity = 1.8;
    spot.color = new Float32Array([1, 1, 1, 1]);

    let spotalso = new SpotLightObject(ctx);
    spotalso.setPosition(-115, 400, -80);
    spotalso.fov = 12.0;
    spotalso.near = 100.0;
    spotalso.far = 10000.0;
    spotalso.falloffRadius = 0.2;
    spotalso.atten_const = 1;
    spotalso.atten_linear = 0;
    spotalso.atten_quad = 0;
    spotalso.intensity = 1.1;
    spotalso.color = new Float32Array([1, 1, 1, 1]);

    spot.setShadowDims(2048, 2048);
    spot.setShadows(false);
    spot.lookAt(0, 0, 0);

    spotalso.setShadowDims(2048, 2048);
    spotalso.setShadows(true);
    spotalso.lookAt(0, 0, 0);
    spotalso.falloffRadius = 0.00001;

    let amb = new AmbientLightObject(ctx);
    amb.color = [0.5, 0.5, 0.5, 1.0];
    amb.intensity = 0.3;
    root.addChild(amb);

    // rot_two.addChild(spot);
    rot_two.addChild(spotalso);
    root.addChild(rot_two);
  }
}