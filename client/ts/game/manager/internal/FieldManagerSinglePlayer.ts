import { FieldManager } from "../FieldManager";
import { GrassFieldManager } from "./fieldmgr/GrassFieldManager";
import { LavaFieldManager } from "./fieldmgr/LavaFieldManager";
import { BeachFieldManager } from "./fieldmgr/BeachFieldManager";
import { MountainFieldManager } from "./fieldmgr/MountainFieldManager";
import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";

export class FieldManagerSinglePlayer implements FieldManager {
  private grassmgr: GrassFieldManager;
  private lavamgr: LavaFieldManager;
  private beachmgr: BeachFieldManager;
  private mountmgr: MountainFieldManager;

  private grassLen: number;
  private beachLen: number;
  private width: number;
  private seed: number;
  constructor(ctx: GameContext, width: number) {
    this.width = width;
    this.grassmgr = new GrassFieldManager(ctx, this.width);
    this.lavamgr = new LavaFieldManager(ctx, this.width);
    this.beachmgr = new BeachFieldManager(ctx, this.width);
    this.mountmgr = new MountainFieldManager(ctx, this.width);

    this.grassLen = 10;
    this.beachLen = 10;
  }

  getFieldModel(n: number) {
    // let field managers take care of it
    // delegate responsibility for transitional fields to the next field
    // start from 0 at tx point
    if (n < this.grassLen) {
      return this.grassmgr.getFieldModel(n);
    } else if (n < (this.grassLen + this.beachLen)) {
      return this.beachmgr.getFieldModel(n - this.grassLen);
    } else {
      return this.mountmgr.getFieldModel(n - (this.grassLen + this.beachLen));
    }
  }

  setFieldSeed(n: number) {
    this.seed = n;
    this.grassmgr.setFieldSeed(n);
    this.lavamgr.setFieldSeed(n);
    this.beachmgr.setFieldSeed(n);
    this.mountmgr.setFieldSeed(n);
  }

  setGrassLength(n: number) {
    this.grassLen = n;
  }

  setBeachLength(n: number) {
    this.beachLen = n;
  }
}