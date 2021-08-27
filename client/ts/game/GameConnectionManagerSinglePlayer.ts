import { vec2, vec3 } from "gl-matrix";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
import { SinglePlayerMapState } from "./manager/internal/SinglePlayerMapState";
import { PlayerInputState } from "./PlayerInputState";
import { PlayerState } from "./PlayerState";
import { TileID } from "./tile/TileID";
import { LayerInstance } from "./tile/LayerInstance";

const PLAYER_MOTION_STATES = [PlayerInputState.MOVE_LEFT, PlayerInputState.MOVE_RIGHT, PlayerInputState.MOVE_UP, PlayerInputState.MOVE_DOWN, PlayerInputState.IDLE];

interface ExplosionRecord {
  time: number;
  x: number;
  y: number;
}

const MAX_BOMB_COUNT = 8;
const EXPLOSION_DUR = 0.15;
// implement as game object so that we can receive update from root object
// alternatively: we give it to some manager component which promises to update it
// the manager component can handle dialogue, etc.
// i'll do it later :)
export class GameConnectionManagerSinglePlayer extends GameObject implements GameConnectionManager {
  private state: SinglePlayerMapState;
  private playerpos: [number, number];
  private playermotion: PlayerInputState;
  private layer: Map<number, LayerInstance>;
  private currentLayerInstanceID: number;
  private bombCount: number;
  private detonations: Set<ExplosionRecord>;
  private time: number;

  private scoreElem: HTMLElement;

  constructor(ctx: GameContext) {
    super(ctx);
    this.state = new SinglePlayerMapState(11);
    this.playerpos = [0, 0];
    this.layer = new Map();
    this.currentLayerInstanceID = 0;
    this.bombCount = 0;

    this.detonations = new Set();
    this.time = 0;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < this.state.dims[1]; j++) {
        this.state.setTile(i, j, TileID.EMPTY);
      }
    }

    this.scoreElem = document.createElement("div");
    this.scoreElem.id = "info";
    let score = document.createElement("div");
    score.id = "score";
    score.textContent = "0m";
    this.scoreElem.appendChild(score);

    let time = document.createElement("div");
    time.id = "time";
    time.textContent = "0s";
    this.scoreElem.appendChild(time);
    document.querySelector("body").appendChild(this.scoreElem);
  }

  getMapState() {
    // return an internally-managed game map state which generates and returns tiles on the fly
    this.state.setLayer(this.layer);
    return this.state;
  }

  getPlayerList() {
    let me : PlayerState = {
      name: "player",
      position: this.playerpos,
      lastInput: this.playermotion
    };

    let res = new Map();
    res.set(1, me);
    return res;
  }

  getMapTitle() {
    return "TEST_001";
  }

  update() {
    let delta = this.getContext().getDelta();
    this.time += delta;
    // with bombs they have just placed down.
    let collisionIgnoreList : Array<vec2> = [];
    for (let inst of this.layer.values()) {
      let pos = inst.position;
      let delta = [Math.abs(pos[0] - this.playerpos[0]), Math.abs(pos[1] - this.playerpos[1])];
      // eps factor -- in case float rounding becomes an issue, this should be negligible in gameplay however
      if (delta[0] < 0.999 && delta[1] < 0.999) {
        collisionIgnoreList.push([pos[0], pos[1]]);
      }
    }

    // clear explosions
    this.clearExplosions();

    // snag current motion state
    switch (this.playermotion) {
      case PlayerInputState.MOVE_LEFT:
        this.playerpos[0] -= 6.0 * delta;
        break;
      case PlayerInputState.MOVE_RIGHT:
        this.playerpos[0] += 6.0 * delta;
        break;
      case PlayerInputState.MOVE_UP:
        this.playerpos[1] -= 6.0 * delta;
        break;
      case PlayerInputState.MOVE_DOWN:
        this.playerpos[1] += 6.0 * delta;
    }

    if (this.playerpos[0] < 0) {
      this.playerpos[0] = 0;
    }

    if (this.playerpos[1] < 0) {
      this.playerpos[1] = 0;
    }

    if (this.playerpos[1] > this.state.dims[1] - 1) {
      this.playerpos[1] = this.state.dims[1] - 1;
    }

    this.scoreElem.querySelector("#score").textContent = Math.floor(this.playerpos[0] * 2) + "m";
    this.scoreElem.querySelector("#time").textContent = Math.floor(this.time).toString() + "s";

    // don't do oob check yet!
    let playerTile = [Math.round(this.playerpos[0]), Math.round(this.playerpos[1])];
    let tile = this.state.fetchTiles(playerTile[0] - 1, playerTile[1] - 1, 3, 3);
    let sign = [playerTile[0] - this.playerpos[0], playerTile[1] - this.playerpos[1]];
    // tiles are in direction of respective sign
    // if a tile occupies the checked space
    sign[0] = (sign[0] < 0 ? 1 : -1);
    sign[1] = (sign[1] < 0 ? 1 : -1);
    // add in a check to avoid the character being shot off the end of some border (later lol)
    let curtile = tile.getTile(playerTile[0], playerTile[1]);
    let checkX = [playerTile[0] + sign[0], playerTile[1]];
    let checkY = [playerTile[0], playerTile[1] + sign[1]];
    let tileX = tile.getTile(checkX[0], checkX[1]);
    let tileY = tile.getTile(checkY[0], checkY[1]);

    if (curtile === TileID.CRATE || curtile === TileID.WALL) {
      this.playerpos[0] = Math.round(this.playerpos[0] + sign[0]);
    } else {
      if (tileX === TileID.CRATE || tileX === TileID.WALL) {
        this.playerpos[0] = Math.round(this.playerpos[0]);
      }
  
      if (tileY === TileID.CRATE || tileY === TileID.WALL) {
        this.playerpos[1] = Math.round(this.playerpos[1]);
      }
    }

    // continue moving in that direction
    // now we want to check our layers in the respective direction?
    for (let inst of this.layer.values()) {
      if (inst.type !== TileID.BOMB) {
        continue;
      }

      let pos = inst.position;
      // note: we do this check for every layer, regardless of if we actually care about collisions with it
      let check : boolean = (pos[0] === checkX[0] && pos[1] === checkX[1]);
      check = check || (pos[0] === checkY[0] && pos[1] === checkY[1]);

      // neither tile collision is a problem -- bail out
      if (!check) {
        continue;
      }

      // ensure the location isn't on our "ignore" list
      for (let ignore of collisionIgnoreList) {
        if (pos[0] === ignore[0] && pos[1] === ignore[1]) {
          check = false;
          break;
        }
      }

      if (!check) {
        continue;
      }

      if ((pos[0] === checkX[0] && pos[1] === checkX[1])) {
        this.playerpos[0] = Math.round(this.playerpos[0]);
      }
      
      if (pos[0] === checkY[0] && pos[1] === checkY[1]) {
        this.playerpos[1] = Math.round(this.playerpos[1]);
      }
    }

    // we also want to check our layers and see if an impassable object has been placed on one of these tiles
    // if so: stop the player from moving there!
  }

  private clearExplosions() {
    for (let det of this.detonations) {
      if (this.time - det.time > EXPLOSION_DUR) {
        this.state.setTile(det.x, det.y, TileID.EMPTY);
        this.detonations.delete(det);
      }
    }
  }

  sendInput(i: PlayerInputState) {
    // if i is a movement command: log it as such
    if (PLAYER_MOTION_STATES.indexOf(i) !== -1) {
      this.playermotion = i;
    } else {
      switch (i) {
        case PlayerInputState.BOMB_PLACE:
          // place a bomb at the player's location
          this.handleBombPlace();
          break;
        case PlayerInputState.BOMB_DETONATE:
          this.handleBombDetonate();
          break;
      }
    }

    /**
     * Otherwise:
     *  - if it's a bomb placement, add a bomb to the respective layer
     *  - if it's a bomb detonation, destroy the bombs and modify the map state to reflect it
     *  - todo: shouldn't explosions have a lifespan?
     *  - normally we would let the server handle that but here its not as cut and dry
     *  - i guess we can log them in some big array and terminate them when we need to :)
     */
  }

  getBombCount() {
    return this.bombCount;
  }

  getBombMax() {
    return MAX_BOMB_COUNT;
  }

  private handleBombPlace() {
    // max out
    if (this.bombCount >= MAX_BOMB_COUNT) {
      return;
    }
    let bombPos : vec3 = [Math.round(this.playerpos[0]), Math.round(this.playerpos[1]), 0];
    // ensure there's no other bombs in that location (this shouldn't be a problem)
    for (let id of this.layer.keys()) {
      let inst = this.layer.get(id);
      let pos = inst.position;
      if (pos[0] === bombPos[0] && pos[1] === bombPos[1]) {
        // come up with something smarter ig
        // we can use a tile system here and just make it 3d but there's some overlap
        // x/y key, z in values
        return;
      }
    }

    let id = this.currentLayerInstanceID++;
    let layer = {
      type: TileID.BOMB,
      position: bombPos
    };

    this.layer.set(id, layer);
    this.bombCount++;
  }

  private handleBombDetonate() {
    // check the layer instance set for all bombs
    // bombs detonate, producing explosion tiles in a 3x3 radius wherever walls are not present
    // create a record of the detonation, so that we can revert it
    // add a snippet in update which deletes explosions left by bombs some amount of time after they're generated
    // tilemanager will make it transition smoothly :)

    // place explosion tiles in a set
    // on each update, we'll go through the set and see if any of them need to be cleared
    // if they do, set the tile to a blank

    let bombIDs = [];
    for (let id of this.layer.keys()) {
      let inst = this.layer.get(id);
      if (inst.type === TileID.BOMB) {
        bombIDs.push(id);
      }
    }

    for (let id of bombIDs) {
      // get the bomb's position
      // for every tile in its vicinity which is not a wall, place an explosion
      // place a record of each explosion, so that we can clear them all
      let pos = this.layer.get(id).position;
      let minX = (Math.max(0, pos[0] - 1));
      let maxX = pos[0] + 1;
      let minY = Math.max(0, pos[1] - 1);
      let maxY = Math.min(pos[1] + 1, this.state.dims[1] - 1)

      for (let i = minX; i <= maxX; i++) {
        for (let j = minY; j <= maxY; j++) {
          let tile = this.state.getTile(i, j);
          if (tile !== TileID.WALL) {
            this.state.setTile(i, j, TileID.EXPLOSION);
            this.detonations.add({
              time: this.time,
              x: i,
              y: j
            });
          }
        }
      }

      this.layer.delete(id);
    }

    this.bombCount = 0;
  }
}