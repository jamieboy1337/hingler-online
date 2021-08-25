import { GameContext } from "../../../engine/GameContext";
import { Model } from "../../../engine/model/Model";
import { FieldManager } from "../FieldManager";
import { PBRModel } from "../../../engine/model/PBRModel";
import { GamePBRModel } from "../../../engine/object/game/GamePBRModel";
import { Task } from "../../../../../ts/util/task/Task";
import { GLTFScene } from "../../../engine/loaders/GLTFScene";
import { GrassFieldManager } from "./fieldmgr/GrassFieldManager";

export class FieldManagerSinglePlayer implements FieldManager {
  private grassmgr: GrassFieldManager;
  private seed: number;
  constructor(ctx: GameContext) {
    this.grassmgr = new GrassFieldManager(ctx);
  }

  getFieldModel(n: number) {
    // let field managers take care of it
    // delegate responsibility for transitional fields to the next field
    // start from 0 at tx point
    return this.grassmgr.getFieldModel(n);
  }

  setFieldSeed(n: number) {
    this.seed = n;
  }
}