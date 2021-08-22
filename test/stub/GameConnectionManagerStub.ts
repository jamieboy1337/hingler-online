import { GameConnectionManager } from "../../client/ts/game/GameConnectionManager";
import { GameMapState } from "../../client/ts/game/GameMapState";
import { SinglePlayerMapState } from "../../client/ts/game/manager/internal/SinglePlayerMapState";
import { PlayerInputState } from "../../client/ts/game/PlayerInputState";
import { PlayerState } from "../../client/ts/game/PlayerState";
import { perf } from "../../ts/performance";
import { GameMapStateStub } from "./GameMapStateStub";

// todo: should connectionmanager be aware of time?
// for our single player one we need some method to ensure that it receives updates.
// the real singleplayer one can be constructed as a gameobject
// and then the multiplayer ones don't have to be

export class GameConnectionManagerStub implements GameConnectionManager {
  state : GameMapState;
  private playerpos: [number, number];
  private playerinput: PlayerInputState;
  private perflast: number;
  constructor() {
    this.state = new SinglePlayerMapState(11);
    this.playerpos = [0, 0];
    this.perflast = perf.now();
  }

  getMapState() {
    return this.state;
  }

  getPlayerList() {
    let me : PlayerState = {
      name: "player",
      position: this.playerpos,
      lastInput: this.playerinput
    };

    let res = new Map();
    res.set(1, me);
    return res;
  }

  getMapTitle() {
    return "TEST_001";
  }

  sendInput(i: PlayerInputState) {
    // check my map

    let p = perf.now();
    let delta = (p - this.perflast) / 1000.0;

    this.perflast = p;
    // nop
    switch (i) {
      case PlayerInputState.MOVE_LEFT:
        this.playerpos[0] -= 8.0 * delta;
        this.playerinput = i;
        break;
      case PlayerInputState.MOVE_RIGHT:
        this.playerpos[0] += 8.0 * delta;
        this.playerinput = i;
        break;
      case PlayerInputState.MOVE_UP:
        this.playerpos[1] -= 8.0 * delta;
        this.playerinput = i;
        break;
      case PlayerInputState.MOVE_DOWN:
        this.playerpos[1] += 8.0 * delta;
        this.playerinput = i;
    }

    let playerTile = [Math.round(this.playerpos[0]), Math.round(this.playerpos[1])];
    let tile = this.state.fetchTiles(playerTile[0] - 1, playerTile[1] - 1, 3, 3);
    // we want to look in the direction of the sign of (playertile - playerpos)
    let sign = [playerTile[0] - this.playerpos[0], playerTile[1] - this.playerpos[1]];
    // tiles are in direction of respective sign
    // if a tile occupies the checked space
    sign[0] = (sign[0] < 0 ? 1 : -1);
    sign[1] = (sign[1] < 0 ? 1 : -1);
    // add in a check to avoid the character being shot off the end of some border (later lol)
    // todo: there will ideally be some special tiles but we can depend on a couple tile types being impassable
    let curtile = tile.getTile(playerTile[0], playerTile[1]);
    let checkX = [playerTile[0] + sign[0], playerTile[1]];
    let checkY = [playerTile[0], playerTile[1] + sign[1]];
    let tileX = tile.getTile(checkX[0], checkX[1]);
    let tileY = tile.getTile(checkY[0], checkY[1]);

    if (curtile === 1 || curtile === 3) {
      this.playerpos[0] = Math.round(this.playerpos[0] + sign[0]);
    } else {
      if (tileX === 1 || tileX === 3) {
        this.playerpos[0] = Math.round(this.playerpos[0]);
      }
  
      if (tileY === 1 || tileY === 3) {
        this.playerpos[1] = Math.round(this.playerpos[1]);
      }
    }

    // note: what happens if the player would clip into a wider range of tiles?
    // its not my problem lol
    // also this is just a stub so simply write something which "works"

    // also todo: work on the expanding map with the camera stub

    // note: this component has to be "smart"
    // no other part of our engine worries about the actual game logic, they just do what we dictate
    // so we actually have to handle it in here in the final release
  }
}