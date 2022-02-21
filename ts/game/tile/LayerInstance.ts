import { vec3 } from "gl-matrix";
import { PlayerInputState } from "../PlayerInputState";
import { TileID } from "./TileID";

/**
 * CRTP behavior for copy function
 */
export interface LayerInstanceInterface<Self> {
  copyInstance() : Self;

  type: TileID;
  position: vec3;
}

export class LayerInstance implements LayerInstanceInterface<LayerInstance> {
  type: TileID;
  position: vec3;

  // add copy function?
  copyInstance() {
    let res = new LayerInstance();
    res.type = this.type;
    res.position = vec3.copy(vec3.create(), this.position);
    return res;
  }
}

export class EnemyInstance extends LayerInstance implements LayerInstanceInterface<EnemyInstance> {
  direction: PlayerInputState;
  // enemies which are "plucked" are dead (for now)

  copyInstance() : EnemyInstance {
    let res = new EnemyInstance();
    res.position = vec3.copy(vec3.create(), this.position);
    res.type = this.type;
    res.direction = this.direction;
    return res;
  }
}

export class GoatInstance extends EnemyInstance implements LayerInstanceInterface<GoatInstance> {
  runTime: number;
  // indicates how long the goat has been dashing for

  stunTime: number;
  // indicates how long the goat has been stunned for

  copyInstance() : GoatInstance {
    // lots of redundant code :(
    let goat = new GoatInstance();
    goat.position = vec3.copy(vec3.create(), this.position);
    goat.type = this.type;
    goat.direction = this.direction;
    goat.runTime = this.runTime;
    goat.stunTime = this.stunTime;
    return goat;
  }
}