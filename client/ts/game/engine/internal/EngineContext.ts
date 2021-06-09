import { perf } from "../../../../../ts/performance";
import { GameContext } from "../GameContext";

/**
 * INTERNAL ONLY.
 */
export class EngineContext implements GameContext {
  lastTimePoint: number;
  lastDelta: number;

  constructor() {

  }

  getDelta() {
    return this.lastDelta;
  }

  updateDelta() {
    let timept = perf.now();
    this.lastDelta = (timept - this.lastTimePoint) / 1000;
    this.lastTimePoint = timept;
  }
}