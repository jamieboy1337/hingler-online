import { GameConnectionManager } from "../../client/ts/game/GameConnectionManager";
import { PlayerInputState } from "../../client/ts/game/PlayerInputState";
import { GameMapStateStub } from "./GameMapStateStub";

export class GameConnectionManagerStub implements GameConnectionManager {
  state : GameMapStateStub;
  constructor() {
    this.state = new GameMapStateStub();
  }

  getMapState() {
    return this.state;
  }

  getPlayerList() {
    return new Map();
  }

  getMapTitle() {
    return "TEST_001";
  }

  sendInput(i: PlayerInputState) {
    // nop
  }
}