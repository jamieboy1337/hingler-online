import { GameContext } from "../../../hingler-party/client/ts/engine/GameContext";
import { GameObject } from "../../../hingler-party/client/ts/engine/object/game/GameObject";
import { GamePBRModel } from "../../../hingler-party/client/ts/engine/object/game/GamePBRModel";
import { SpotLight } from "../../../hingler-party/client/ts/engine/object/game/light/SpotLight";
import { SpotLightObject } from "../../../hingler-party/client/ts/engine/object/game/light/SpotLightObject";

export class PlayerGameObject extends GameObject {
  private pivot: GameObject;
  private spot: SpotLightObject;
  private player: GameObject;

  constructor(ctx: GameContext) {
    super(ctx);
    let player =        new GamePBRModel(ctx, "../res/chewingcharacter.glb");
    let deathRotate =   new GameObject(ctx);
    let spot =          new SpotLightObject(ctx);

    spot.setPosition(0.01, 11, 0.01);
    spot.lookAt(0, 0, 0);
    
    spot.intensity = 0;
    spot.color = new Float32Array([1, 1, 1, 1]);
    spot.fov = 28;
    spot.atten_const = 1;
    spot.atten_linear = 0.0;
    spot.atten_quad = 0.0;
    spot.falloffRadius = 0.1;
    spot.near = 0.1;
    spot.far = 100.0;
    
    spot.setShadows(false);
    this.addChild(spot);

    deathRotate.addChild(player);
    deathRotate.setPosition(-0.86, 0, 0);
    player.setPosition(0.86, 0, 0);

    this.addChild(deathRotate);

    this.pivot = deathRotate;
    this.spot = spot;
    this.player = player;
  }

  getSpot() {
    return this.spot as SpotLight;
  }

  // replace this with something like a death animation
  // whatever idc
  setPivotRotation(deg: number) {
    this.pivot.setRotationEuler(deg, 0, 0);
  }
}