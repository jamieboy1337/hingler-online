import { GameContext } from "../../../engine/GameContext";
import { Model } from "../../../engine/model/Model";
import { FieldManager } from "../FieldManager";
import { PBRModel } from "../../../engine/model/PBRModel";
import { GamePBRModel } from "../../../engine/object/game/GamePBRModel";
import { Task } from "../../../../../ts/util/task/Task";
import { GLTFScene } from "../../../engine/loaders/GLTFScene";
import { GrassFieldManager } from "./fieldmgr/GrassFieldManager";
import { LavaFieldManager } from "./fieldmgr/LavaFieldManager";
import { BeachFieldManager } from "./fieldmgr/BeachFieldManager";

export class FieldManagerSinglePlayer implements FieldManager {
  private grassmgr: GrassFieldManager;
  private lavamgr: LavaFieldManager;
  private beachmgr: BeachFieldManager;
  private width: number;
  private seed: number;
  constructor(ctx: GameContext, width: number) {
    this.width = width;
    this.grassmgr = new GrassFieldManager(ctx, this.width);
    this.lavamgr = new LavaFieldManager(ctx, this.width);
    this.beachmgr = new BeachFieldManager(ctx, this.width);
  }

  getFieldModel(n: number) {
    // let field managers take care of it
    // delegate responsibility for transitional fields to the next field
    // start from 0 at tx point
    if (n < 2) {
      return this.grassmgr.getFieldModel(n);
    } else {
      return this.beachmgr.getFieldModel(n - 2);
    }
  }

  setFieldSeed(n: number) {
    this.seed = n;
    this.grassmgr.setFieldSeed(n);
    this.lavamgr.setFieldSeed(n);
    this.beachmgr.setFieldSeed(n);
  }
}