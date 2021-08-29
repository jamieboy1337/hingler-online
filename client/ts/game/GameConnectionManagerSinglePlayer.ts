import { vec2, vec3 } from "gl-matrix";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
import { SinglePlayerMapState } from "./manager/internal/SinglePlayerMapState";
import { PlayerInputState } from "./PlayerInputState";
import { PlayerState } from "./PlayerState";
import { TileID } from "./tile/TileID";
import { LayerInstance } from "./tile/LayerInstance";
import { MOTION_INPUT } from "./manager/InputManager";

export const PLAYER_MOTION_STATES = [PlayerInputState.MOVE_LEFT, PlayerInputState.MOVE_RIGHT, PlayerInputState.MOVE_UP, PlayerInputState.MOVE_DOWN, PlayerInputState.IDLE];

const knightSpeed = 1.5;

interface ExplosionRecord {
  time: number;
  x: number;
  y: number;
}

interface KnightState {
  direction: PlayerInputState;
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
  private playerdead: boolean;
  private playermotion: PlayerInputState;

  private loaded: boolean;
  // todo: implement a custom map (coordmap)
  // which works like our map but also provides coordinate access
  // then update the code as needed

  private bombCount: number;
  private detonations: Set<ExplosionRecord>;
  private time: number;

  private scoreElem: HTMLElement;

  constructor(ctx: GameContext) {
    super(ctx);
    this.state = new SinglePlayerMapState(11);
    this.playerpos = [0, 0];
    this.bombCount = 0;

    this.playerdead = false;

    this.loaded = false;

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

  get killerIsDead() {
    return this.playerdead;
  }

  getMapState() {
    return this.state;
  }

  getPlayerList() {
    let me : PlayerState = {
      name: "player",
      position: this.playerpos,
      lastInput: this.playermotion,
      dead: this.playerdead
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

    if (this.time < 0.25 || (!this.loaded && this.getContext().getFileLoader().getFractionLoaded() < 0.99)) {
      console.log(this.getContext().getFileLoader().getFractionLoaded());
      // ignore frames before loading is complete
      return;
    } else if (!this.loaded) {
      document.body.removeChild(document.getElementById("loading"));
      this.loaded = true;
      // give us a reset for the sake of it
      this.time = 0;
    }

    this.moveKnights(delta);
    let velo : [number, number] = [0, 0];
    // snag current motion state

    if (!this.playerdead) {
      switch (this.playermotion) {
        case PlayerInputState.MOVE_LEFT:
          velo[0] = -6.0 * delta;
          break;
        case PlayerInputState.MOVE_RIGHT:
          velo[0] = 6.0 * delta;
          break;
        case PlayerInputState.MOVE_UP:
          velo[1] = -6.0 * delta;
          break;
        case PlayerInputState.MOVE_DOWN:
          velo[1] = 6.0 * delta;
      }
    }
    
    // clear explosions
    this.clearExplosions();

    if (!this.playerdead) {
      this.scoreElem.querySelector("#score").textContent = Math.floor(this.playerpos[0] * 2) + "m";
      this.scoreElem.querySelector("#time").textContent = Math.floor(this.time).toString() + "s";
    }


    this.playerpos = this.stepInstance(this.playerpos, velo);
    // check if the player is near any explosion tiles (round test i think, round their pos and check if the tile is gone)
    // alternatively, we check every tile which they are at least .2 in (1 - 4 tiles)
    if (this.state.getTile(Math.round(this.playerpos[0]), Math.round(this.playerpos[1])) === TileID.EXPLOSION) {
      this.playerdead = true; 
    }
  }

  private stepInstance(init: [number, number], velo: [number, number]) : [number, number] {
    let collisionIgnoreList : Array<vec2> = [];

    // if velo is too large: split this into multiple calls, to avoid skipping tiles
    if (velo[0] > 1 || velo[1] > 1) {
      let denom = Math.ceil(Math.max(velo[1] * 3, velo[0] * 3));
      let velo_itr : [number, number] = [velo[0] / denom, velo[1] / denom];
      let res : [number, number];
      for (let i = 0; i < denom; i++) {
        res = this.stepInstance(init, velo_itr);
      }

      return res;
    }

    for (let inst of this.state.layer.values()) {
      let pos = inst.position;
      let delta = [Math.abs(pos[0] - init[0]), Math.abs(pos[1] - init[1])];
      if (delta[0] < 0.999 && delta[1] < 0.999) {
        collisionIgnoreList.push([pos[0], pos[1]]);
      }
    }

    let res : [number, number] = [init[0], init[1]];
    res[0] += velo[0];
    res[1] += velo[1];

    if (res[0] < 0) {
      res[0] = 0;
    }

    if (res[1] < 0) {
      res[1] = 0;
    }

    if (res[1] > this.state.dims[1] - 1) {
      res[1] = this.state.dims[1] - 1;
    }

    let eTile = res.map(Math.round);
    let tile = this.state.fetchTiles(eTile[0] - 1, eTile[1] - 1, 3, 3);
    let sign = [eTile[0] - res[0], eTile[1] - res[1]];

    sign[0] = (sign[0] < 0 ? 1 : -1);
    sign[1] = (sign[1] < 0 ? 1 : -1);

    let curtile = tile.getTile(eTile[0], eTile[1]);
    let checkX = [eTile[0] + sign[0], eTile[1]];
    let checkY = [eTile[0], eTile[1] + sign[1]];
    let tileX = tile.getTile(checkX[0], checkX[1]);
    let tileY = tile.getTile(checkY[0], checkY[1]);

    if (curtile === TileID.CRATE || curtile === TileID.WALL) {
      res[0] = Math.round(res[0] + sign[0]);
    } else {
      if (tileX === TileID.CRATE || tileX === TileID.WALL) {
        res[0] = Math.round(res[0]);
      }
  
      if (tileY === TileID.CRATE || tileY === TileID.WALL) {
        res[1] = Math.round(res[1]);
      }
    }

    for (let inst of this.state.layer.values()) {
      if (inst.type !== TileID.BOMB) {
        continue;
      }

      let pos = inst.position;
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
        res[0] = Math.round(res[0]);
      }
      
      if (pos[0] === checkY[0] && pos[1] === checkY[1]) {
        res[1] = Math.round(res[1]);
      }
    }

    return res;
  }

  private moveKnights(delta: number) {
    // go through our layers, find the knights
    for (let inst of this.state.enemy) {
      if (inst[1].type === TileID.ENEMY_KNIGHT) {
        let data = inst[1];
        // use a function to return a signed direction bit
        let velo = this.getSignFromDirection(data.direction);
        velo[0] *= 1.5 * delta;
        velo[1] *= 1.5 * delta;

        let pos = inst[1].position;
        let init : [number, number] = [pos[0], pos[1]];
        let fin = this.stepInstance(init, velo);

        if (fin[0] === pos[0] && fin[1] === pos[1]) {
          // randomize direction
          let randDirInd = Math.floor(Math.random() * 4);
          let randDir : PlayerInputState;
          // check in that direction
          let sign : [number, number];
          let tile : TileID;
          let i = -1;
          do {
            randDir = PLAYER_MOTION_STATES[randDirInd % 4];
            sign = this.getSignFromDirection(randDir);
            let tileCoord = [Math.floor(fin[0]) + sign[0], Math.floor(fin[1]) + sign[1]];
            tile = this.state.getTile(tileCoord[0], tileCoord[1]);
            i++;
            randDirInd++;
            // note: we need a layer check here as well :(
          } while ((tile === TileID.CRATE || tile === TileID.WALL) && i < 4);

          if (i >= 4) {
            randDir = PlayerInputState.MOVE_DOWN;
          }

          data.direction = randDir;
        }

        data.position[0] = fin[0];
        data.position[1] = fin[1];
        
        this.state.enemy.set(inst[0], data);
      }
    }
  }

  private getSignFromDirection(dir: PlayerInputState) : [number, number] {
    switch (dir) {
      case PlayerInputState.MOVE_LEFT:
        return [-1, 0];
      case PlayerInputState.MOVE_RIGHT:
        return [1, 0];
      case PlayerInputState.MOVE_UP:
        return [0, -1];
      case PlayerInputState.MOVE_DOWN:
        return [0, 1];
      default:
        return [0, 0];
    }
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
    if (this.playerdead) {
      return;
    }

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
    for (let id of this.state.layer.keys()) {
      let inst = this.state.layer.get(id);
      let pos = inst.position;
      if (pos[0] === bombPos[0] && pos[1] === bombPos[1]) {
        // come up with something smarter ig
        // we can use a tile system here and just make it 3d but there's some overlap
        // x/y key, z in values
        return;
      }
    }

    let id = this.state.nextID++;
    let layer = {
      type: TileID.BOMB,
      position: bombPos
    };

    this.state.layer.set(id, layer);
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
    for (let id of this.state.layer.keys()) {
      let inst = this.state.layer.get(id);
      if (inst.type === TileID.BOMB) {
        bombIDs.push(id);
      }
    }

    for (let id of bombIDs) {
      // get the bomb's position
      // for every tile in its vicinity which is not a wall, place an explosion
      // place a record of each explosion, so that we can clear them all
      let pos = this.state.layer.get(id).position;
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

      this.state.layer.delete(id);
    }

    this.bombCount = 0;
  }
}