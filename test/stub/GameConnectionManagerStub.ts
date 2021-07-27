import { GameConnectionManager } from "../../client/ts/game/GameConnectionManager";
import { PlayerInputState } from "../../client/ts/game/PlayerInputState";
import { GameMapStateStub } from "./GameMapStateStub";

export class GameConnectionManagerStub implements GameConnectionManager {
  getMapState() {
    return new GameMapStateStub();
  }

  getPlayerList() {
    return [];
  }

  getMapTitle() {
    return "TEST_001";
  }

  sendInput(i: PlayerInputState) {
    // nop
  }
}