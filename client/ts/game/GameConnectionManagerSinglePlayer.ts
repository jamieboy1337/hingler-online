import { vec2, vec3 } from "gl-matrix";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
import { SinglePlayerMapState } from "./manager/internal/SinglePlayerMapState";
import { PlayerInputState } from "./PlayerInputState";
import { PlayerState } from "./PlayerState";
import { TileID } from "./tile/TileID";
import { shadersStillCompiling } from "../engine/gl/ShaderProgramBuilder";
import { GoatInstance, LayerInstance } from "./tile/LayerInstance";

export const PLAYER_MOTION_STATES = [PlayerInputState.MOVE_LEFT, PlayerInputState.MOVE_RIGHT, PlayerInputState.MOVE_UP, PlayerInputState.MOVE_DOWN, PlayerInputState.IDLE];

const knightSpeed = 1.5;
const BOMB_RADIUS = 1;

const GOAT_BASE_SPEED = 1.0;
const GOAT_MAX_SPEED  = 4.0;
const GOAT_ACCEL_DUR  = .25;
const GOAT_STUN_TIME  = 2.5;

const TERM_SHOCK_COEFF = (1 / 450);
const TERM_SHOCK_INIT_VELO = 0.75;

const BASE_SPEED_POWERUP = 0.1;

const POWERUP_IDS = [TileID.POWER_BOMB, TileID.POWER_RADIUS, TileID.POWER_SPEED];

// todo: draw colored outline around stronger tiles, brighten them?


// todo: add grades of powerups
// higher grades = better adders
const CRATE_POWERUP_CHANCE = .1;
const KNIGHT_POWERUP_CHANCE = 1.0;
const CRAB_POWERUP_CHANCE = 1.0;

const BASE_SPEED = 3.0;

interface ExplosionRecord {
  time: number;
  x: number;
  y: number;
}

interface KnightState {
  direction: PlayerInputState;
}

const EXPLOSION_DUR = 0.02;
// implement as game object so that we can receive update from root object
// alternatively: we give it to some manager component which promises to update it
// the manager component can handle dialogue, etc.
// i'll do it later :)
export class GameConnectionManagerSinglePlayer extends GameObject implements GameConnectionManager {
  private state: SinglePlayerMapState;
  private playerpos: [number, number];
  private playerdead: boolean;
  private playermotion: PlayerInputState;
  private playerdirection: PlayerInputState;

  // stats
  private maxBombCount: number;
  private speed: number;
  private radius: number;

  private loaded: boolean;
  // todo: implement a custom map (coordmap)
  // which works like our map but also provides coordinate access
  // then update the code as needed

  private bombCount: number;
  private detonations: Set<ExplosionRecord>;
  private time: number;

  private scoreElem: HTMLElement;

  private knightKills: number;
  private crabKills: number;
  private goatKills: number;

  private bombCollision: Set<number>;

  private termShockPos: number;

  constructor(ctx: GameContext) {
    super(ctx);
    this.state = new SinglePlayerMapState(11);
    this.playerpos = [0, 0];
    this.bombCount = 0;

    this.maxBombCount = 1;
    this.speed = BASE_SPEED;
    this.radius = 1;

    this.termShockPos = -40;

    this.bombCollision = new Set();

    this.playerdead = false;

    this.playermotion = PlayerInputState.IDLE;
    this.playerdirection = PlayerInputState.MOVE_RIGHT;

    this.loaded = false;

    this.detonations = new Set();
    this.time = 0;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < this.state.dims[1]; j++) {
        this.state.setTile(i, j, TileID.EMPTY);
      }
    }


    this.knightKills = 0;
    this.crabKills = 0;
    this.goatKills = 0;
  }

  get knightStart() {
    return this.state.knightStart;
  }

  get crabStart() {
    return this.state.crabStart;
  }

  get goatStart() {
    return this.state.goatStart;
  }

  set knightStart(val: number) {
    this.state.knightStart = val;
  }

  set crabStart(val: number) {
    this.state.crabStart = val;
  }

  set goatStart(val: number) {
    this.state.goatStart = val;
  }

  get killerIsDead() {
    return this.playerdead;
  }

  reset() {
    this.playerpos = [0, 0];
    this.bombCount = 0;
    this.knightKills = 0;
    this.crabKills = 0;
    this.goatKills = 0;
    this.maxBombCount = 1;
    this.speed = BASE_SPEED;
    this.radius = 1;
    this.playerdead = false;
    let stateReplace = new SinglePlayerMapState(11);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < stateReplace.dims[1]; j++) {
        stateReplace.setTile(i, j, TileID.EMPTY);
      }
    }

    stateReplace.knightStart = this.state.knightStart;
    stateReplace.crabStart = this.state.crabStart;
    stateReplace.goatStart = this.state.goatStart;

    this.state = stateReplace;

    this.time = 0;
  }

  getKnightKillCount() {
    return this.knightKills;
  }

  getCrabKillCount() {
    return this.crabKills;
  }

  getGoatKillCount() {
    return this.goatKills;
  }

  getMapState() {
    return this.state;
  }

  getPlayerList() {
    let me : PlayerState = {
      name: "player",
      position: this.playerpos,
      lastInput: this.playerdirection,
      dead: this.playerdead
    };

    let res : Map<number, PlayerState> = new Map();
    res.set(1, me);
    return res;
  }

  getMapTitle() {
    return "TEST_001";
  }

  update() {
    let delta = this.getContext().getDelta();
    this.time += delta;

    this.termShockPos = this.shockFunc(this.time);

    // advance termination shock slowly (start at like -40?)
    // when the shock is within 30 tiles, begin to dim the lights to a low red
    // kill the player if they are more than 0.5 tiles behind the shock

    if (this.time < 0.25 || (!this.loaded && (this.getContext().getFileLoader().getFractionLoaded() < 0.99 || shadersStillCompiling() > 0))) {
      // ignore frames before loading is complete
      return;
    } else if (!this.loaded) {
      document.getElementById("loading").classList.add("hidden");
      this.loaded = true;
      // give us a reset for the sake of it
      this.time = 0;
    }

    this.moveKnights(delta);
    this.moveCrabs(delta);
    this.moveGoats(delta);
    let velo : [number, number] = [0, 0];
    // snag current motion state

    if (!this.playerdead) {
      switch (this.playermotion) {
        case PlayerInputState.MOVE_LEFT:
          velo[0] = -this.speed * delta;
          break;
        case PlayerInputState.MOVE_RIGHT:
          velo[0] = this.speed * delta;
          break;
        case PlayerInputState.MOVE_UP:
          velo[1] = -this.speed * delta;
          break;
        case PlayerInputState.MOVE_DOWN:
          velo[1] = this.speed * delta;
      }
    }


    this.playerpos = this.stepInstance(this.playerpos, velo, true);
    // check if the player is near any explosion tiles (round test i think, round their pos and check if the tile is gone)
    // alternatively, we check every tile which they are at least .2 in (1 - 4 tiles)
    if (this.state.getTile(Math.round(this.playerpos[0]), Math.round(this.playerpos[1])) === TileID.EXPLOSION) {
      this.playerdead = true; 
    }

    // check if there's any knights near the player
    let playertile = this.playerpos.map(Math.round);
    for (let i = playertile[0] - 1; i <= playertile[0] + 1; i++) {
      for (let j = playertile[1] - 1; j <= playertile[1] + 1; j++) {
        let enemies = this.state.enemy.getEnemiesAtCoordinate(i, j);
        for (let enemyArr of enemies) {
          let enemy = enemyArr[1];
          let delta = [Math.abs(this.playerpos[0] - enemy.position[0]), Math.abs(this.playerpos[1] - enemy.position[1])];
          if (delta[0] < 0.5 && delta[1] < 0.5) {
            this.playerdead = true;
          }
        }
      }
    }

    if (this.termShockPos > this.playerpos[0] + 0.5) {
      this.playerdead = true;
    }

    // check if the player can pick up a powerup
    let layerNear = this.state.layer.getEnemiesAtCoordinate(playertile[0], playertile[1]);
    if (layerNear.length > 0) {
      for (let instArr of layerNear) {
        let inst = instArr[1];
        if (inst.type >= TileID.POWER_SPEED && inst.type <= TileID.POWER_RADIUS) {
          this.state.layer.delete(instArr[0]);
          this.handlePowerup(inst.type);
        }
      }
    }
    
    // purge layer instances which are behind the term shock
    for (let inst of this.state.layer) {
      if (inst[1].position[0] < (this.termShockPos - 2)) {
        this.state.layer.delete(inst[0]);
      }
    }
    
    // purge enemies which are behind the term shock
    for (let enemy of this.state.enemy) {
      if (enemy[1].position[0] < (this.termShockPos - 2)) {
        this.state.enemy.delete(enemy[0]);
      }
    }

    // clear explosions
    this.clearExplosions();

  }

  private handlePowerup(type: TileID) {
    switch (type) {
      case TileID.POWER_BOMB:
        this.maxBombCount++;
        break;
      case TileID.POWER_RADIUS:
        this.radius++;
        break;
      case TileID.POWER_SPEED:
        this.speed += BASE_SPEED_POWERUP;
    }
  }

  private stepInstance(init: [number, number], velo: [number, number], usePlayerBombCollision?: boolean) : [number, number] {
    let collisionIgnoreList : Array<vec2> = [];

    // bomb collision: we want to roll off bombs when we run into them
    // but players shouldn't do the same
    // one solution would be to maintain a list of "nocollide" objects for every instance and just ignore those
    // enemyinstances would have a "nocollide" list and whenever we make a new bomb, we check every instance to see if its near that bomb
    // i fucking hate that
    // i'll just leave this field open for the player and use it as needed >:)
    // if velo is too large: split this into multiple calls, to avoid skipping tiles
    if (Math.abs(velo[0]) > 0.5 || Math.abs(velo[1]) > 0.5) {
      let denom = Math.ceil(Math.max(Math.abs(velo[1] * 6), Math.abs(velo[0] * 6)));
      let velo_itr : [number, number] = [velo[0] / denom, velo[1] / denom];
      let res : [number, number];
      for (let i = 0; i < denom; i++) {
        res = this.stepInstance(init, velo_itr);
      }

      return res;
    }

    for (let inst of this.state.layer.entries()) {
      let pos = inst[1].position;
      let delta = [Math.abs(pos[0] - init[0]), Math.abs(pos[1] - init[1])];
      // use the old ignore handler

      if (usePlayerBombCollision && this.bombCollision.has(inst[0])) {
        collisionIgnoreList.push([pos[0], pos[1]]);
      }
      
      if (delta[0] < 0.999 && delta[1] < 0.999) {
        if (!usePlayerBombCollision) {
          collisionIgnoreList.push([pos[0], pos[1]]);
        }
      } else if (usePlayerBombCollision) {
        this.bombCollision.delete(inst[0]);
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
    let signFloat = [eTile[0] - res[0], eTile[1] - res[1]];
    let sign = [(signFloat[0] < 0 ? 1 : -1), (signFloat[1] < 0 ? 1 : -1)];

    let curtile = tile.getTile(eTile[0], eTile[1]);
    let checkX = [eTile[0] + sign[0], eTile[1]];
    let checkY = [eTile[0], eTile[1] + sign[1]];
    let checkXY = [eTile[0] + sign[0], eTile[1] + sign[1]];
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

    // todo: use enemymap to greatly limit number of layers checked

    for (let inst of this.state.layer.values()) {
      if (inst.type !== TileID.BOMB) {
        continue;
      }

      let pos = inst.position;
      let check : boolean = (pos[0] === checkX[0] && pos[1] === checkX[1]);
      check = check || (pos[0] === checkY[0] && pos[1] === checkY[1]);
      check = check || (pos[0] === checkXY[0] && pos[1] === checkXY[1]);

      // no tile collision is a problem -- bail out
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

      // ignore this -- treat it like tiles!
      if (!usePlayerBombCollision) {
        if (pos[0] === checkXY[0] && pos[1] === checkXY[1]) {
          let signMag = signFloat.map(Math.abs);
          if (signMag[0] > signMag[1]) {
            res[1] = Math.round(res[1]);
          } else {
            res[0] = Math.round(res[0]);
          }
        }
      }
    }

    return res;
  }

  getScore() {
    return this.playerpos[0] * 2;
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

        // calculate floor of old and new positions
        // if they change, try to change direction
        if (fin[0] === pos[0] && fin[1] === pos[1]) {
          data.direction = this.pickFreeDirection(fin);
        }

        data.position[0] = fin[0];
        data.position[1] = fin[1];

        // if position is less than term shock: die
        if (fin[0] < this.termShockPos) {
          this.state.enemy.delete(inst[0]);
          continue;
        }

        this.state.enemy.set(inst[0], data);
        let tile = this.state.getTile(Math.round(fin[0]), Math.round(fin[1]));
        if (tile === TileID.EXPLOSION) {
          // gone!
          this.state.enemy.delete(inst[0]);
          let roll = Math.random();
          if (roll < CRAB_POWERUP_CHANCE) {
            let inst = new LayerInstance();
            inst.type = this.getRandomKnightPowerup();
            inst.position = [Math.round(fin[0]), Math.round(fin[1]), 0];
            this.state.layer.set(this.state.nextID++, inst);
          }
          // spawn a powerup potentially
          this.knightKills++;
        }
        
      }
    }
  }

  // moveGoats
  // goats will move slightly slower than other NPCs...
  // but if they have sightline on the player, they will charge.
  // (distance of 16 tiles probably, trace straight line along axis to player)

  // have this function only step a single instance at a time
  // we'll call the funcs by type
  private moveGoats(delta: number) {
    for (let inst of this.state.enemy) {
      if (inst[1].type === TileID.ENEMY_GOAT) {
        let goat = inst[1] as GoatInstance;

        // check if the player is visible from this new position
        // first: check if the player is on an axis (diff between rounded x or y is 0)

        // only do this if we pass a tile boundary

        let velo = this.getSignFromDirection(goat.direction);

        const speedT = Math.min(goat.runTime / GOAT_ACCEL_DUR, 1.0);
        const speed = (speedT * GOAT_MAX_SPEED) + ((1.0 - speedT) * GOAT_BASE_SPEED);

        if (goat.runTime > 0) {
          goat.runTime += delta;
        }

        velo[0] *= speed * delta;
        velo[1] *= speed * delta;
        
        let pos = goat.position;
        let init : [number, number] = [pos[0], pos[1]];

        let fin = this.stepInstance(init, velo);

        if (fin[0] === pos[0] && fin[1] === pos[1]) {
          if (goat.runTime > 0) {
            goat.runTime = 0;
            goat.stunTime = GOAT_STUN_TIME;
          } else {
            goat.direction = this.pickFreeDirection(fin.map(Math.round) as [number, number]);
          }
        }

        const finFloor = fin.map(Math.floor) as [number, number];
        const posFloor = pos.map(Math.floor) as [number, number];

        // detect new tile
        let chargePass = (finFloor[0] !== posFloor[0] || finFloor[1] !== posFloor[1]);

        const adjust = Math.max(Math.abs(fin[0] - pos[0]), Math.abs(fin[1] - pos[1]));

        let dir = goat.direction;
        if (goat.runTime <= 0) {
          let playerTile = this.playerpos.map(Math.round) as [number, number];
          let goatTile = goat.position.map(Math.round) as [number, number];
          let playerDelta = [playerTile[0] - goatTile[0], playerTile[1] - goatTile[1]];
          let playerDeltaRound = playerDelta.map(Math.round);
          
          let signCurrent = this.getSignFromDirection(dir);
          for (let i = 0; i < 2; i++) {
            if (signCurrent[1 - i] !== 0 && playerDeltaRound[i] === 0) {
              // player has appeared in a direction parallel to line of travel -- charge!
              chargePass = true;
            } 
          }

          // if the player is in a direction parallel to our direction of movement, check.
          // - first, check the deltaround. raise a flag if (sign of dir[n] !== 0 && deltaround[n] === 0)
          if (chargePass && (playerDeltaRound[0] === 0 || playerDeltaRound[1] === 0) && (playerDeltaRound[0] !== playerDeltaRound[1])) {
            // then: step along our tiles and see if there are no blocks between goat and player
            let dirArray = playerDeltaRound.map(Math.sign);
            // temp: ensure this contains what we expect
            let blocked = false;
            let tile : TileID;
            while (goatTile[0] !== playerTile[0] || goatTile[1] !== playerTile[1]) {
              // step goat tile in direction of sign
              tile = this.state.getTile(goatTile[0], goatTile[1]);
              if (tile === TileID.CRATE || tile === TileID.WALL) {
                blocked = true;
                break;
              }

              // check for bombs possibly in the way
              for (let layer of this.state.layer.getEnemiesAtCoordinate(goatTile[0], goatTile[1])) {
                if (layer[1].position[0] === goatTile[0] && layer[1].position[1] === goatTile[1]) {
                  blocked = true;
                  break;
                }
              }

              goatTile[0] += dirArray[0];
              goatTile[1] += dirArray[1];
            }

            // free line to player! 
            // lastly: change our direction to the player's, and charge.

            if (!blocked) {
              if (playerDeltaRound[1] === 0) {
                if (playerDelta[0] > 0) {
                  dir = PlayerInputState.MOVE_RIGHT;
                } else {
                  dir = PlayerInputState.MOVE_LEFT;
                }
              } else {
                if (playerDelta[1] > 0) {
                  dir = PlayerInputState.MOVE_DOWN;
                } else {
                  dir = PlayerInputState.MOVE_UP;
                }
              }

              // non zero epsilon, so it's not equal to 0.
              goat.runTime = .00001;
            }
          }
        }

        if (dir !== goat.direction) {
          // the goat switched directions as a consequence of seeing the player at a tile boundary
          let sign = this.getSignFromDirection(dir);
          goat.direction = dir;
          goat.position[0] = Math.round(fin[0]) + sign[0] * adjust;
          goat.position[1] = Math.round(fin[1]) + sign[1] * adjust;
        }

        if (fin[0] < this.termShockPos) {
          this.state.enemy.delete(inst[0]);
          continue;
        }

        goat.position[0] = fin[0];
        goat.position[1] = fin[1];

        this.state.enemy.set(inst[0], goat);
        let tile = this.state.getTile(Math.round(fin[0]), Math.round(fin[1]));
        if (tile === TileID.EXPLOSION) {
          this.state.enemy.delete(inst[0]);
          
          let power = new LayerInstance();
          power.type = this.getRandomKnightPowerup();
          power.position = [Math.round(fin[0]), Math.round(fin[1]), 0];
          this.state.layer.set(this.state.nextID++, power);
          this.goatKills++;
        }
        // need to write a custom payload
        // charge time as a var (= 0, handles speed ramp up)
        // charge time will be re-zero'd when we hit a wall, and we'll also need a freeze time
        // probably want to put the instance in a "freeze" state
        // lastly: how do we control the eye texture?
        // need some way to "fish out" the PBR material

        // return the material, either instanced or uninstanced, via a scene func
        // write it into the instance?
        // separate the eye model, and swap it out as needed <-- this is the solution which works best with the engine :(

        // we don't currently expose the scaffolding necessary for the client to reach in and customize each material attached to a PBR Model
        // there's no way to really distinguish them from one another on load

        // imo the best alternative is just to swap flat models, it makes sense for now :(
        // OR
        // we have the eyes up front as a separate model, and we fuck with their materials
        // the one caveat is that we also might want to skin the eyes later, and so that might be a pain
        // we want some executive control over their PBR material (texture) but we're also stuck with PBR
        
        // load body, load eyes
        // the eyes will have weights as well, so we can just use the same armature!
        // we swap out the eyes, each of which is attached to that same armature

        // models point to an animation wrapper which controls an armature
        // the animation wrapper packages up the armature data into something which agrees w notions of joints and weights

        // wrapper which associates model data with anim -- we can fetch everything from one class
        // then we can just apply the model data to the models in shader and we're good :)
      }
    }
  }

  private moveCrabs(delta: number) {
    // note: bad iteration.
    //       probably find the crabs beforehand and pass them as a param

    // also note: most of this shit is enemy agnostic, factor in speed.
    for (let inst of this.state.enemy) {
      if (inst[1].type === TileID.ENEMY_CRAB) {
        let data = inst[1];
        // use a function to return a signed direction bit
        let velo = this.getSignFromDirection(data.direction);
        velo[0] *= 1.5 * delta;
        velo[1] *= 1.5 * delta;

        let pos = inst[1].position;
        let init : [number, number] = [pos[0], pos[1]];
        let fin = this.stepInstance(init, velo);
        let finround = fin.map(Math.round) as [number, number];

        // pick a new direction (same as knight)
        let floordif = [Math.floor(pos[0]) - Math.floor(fin[0]), Math.floor(pos[1]) - Math.floor(fin[1])];

        // my guess: fin only applies in one direction -- up then left, our floor decrements on the up, and our floor decrements on the left, meaning that we would try to turn twice.
        // soln: apply the difference between round and fin, to the direction of travel
        if (fin[0] === pos[0] && fin[1] === pos[1]) {
          data.direction = this.pickFreeDirection(finround);
        } else {
          let dir = this.pickFreeDirection(finround);
          if ((floordif[0] !== 0 || floordif[1] !== 0) && (Math.floor(PLAYER_MOTION_STATES.indexOf(dir) / 2) !== Math.floor(PLAYER_MOTION_STATES.indexOf(data.direction) / 2))) {
            // advanced to a new tile -- check if we can turn
            // if the direction opposes the one we are traveling in, ignore it
            // reduce boolean -- move pickfreedirection call outside of if check and merge
            // applies to L/R, and U/D -- we already handled the turn around case so this won't apply
            let tile = finround;
            let del = [fin[0] - tile[0], fin[1] - tile[1]].map(Math.abs);
            let deltaMax = Math.max(del[0], del[1]);
            let sign = this.getSignFromDirection(dir);
            data.direction = dir;
            // offset in new direction of travel, by the distance we've traveled from the tile
            data.position = [Math.round(fin[0]) + (deltaMax * sign[0]), Math.round(fin[1]) + (deltaMax * sign[1]), data.position[2]];
          } else {
            data.position[0] = fin[0];
            data.position[1] = fin[1];
          }
        }


        if (data.position[0] < this.termShockPos) {
          this.state.enemy.delete(inst[0]);
          continue;
        }


        this.state.enemy.set(inst[0], data);
        let tile = this.state.getTile(Math.round(data.position[0]), Math.round(data.position[1]));
        if (tile === TileID.EXPLOSION) {
          // gone!
          this.state.enemy.delete(inst[0]);
          let roll = Math.random();
          if (roll < CRAB_POWERUP_CHANCE) {
            let inst = new LayerInstance();
            inst.type = this.getRandomKnightPowerup();
            inst.position = [Math.round(data.position[0]), Math.round(data.position[1]), 0];
            this.state.layer.set(this.state.nextID++, inst);
          }
          // spawn a powerup potentially
          this.crabKills++;
        }
      }
    }
  }

  // attempts to find a free direction which the player can move in
  private pickFreeDirection(pos: [number, number]) {
    let randDirInd = Math.floor(Math.random() * 4);
    let randDir : PlayerInputState;
    // check in that direction
    let sign : [number, number];
    let tile : TileID;
    let layers: [number, LayerInstance][];
    let tileCoord : [number, number];
    let i = -1;
    do {
      randDir = PLAYER_MOTION_STATES[randDirInd % 4];
      sign = this.getSignFromDirection(randDir);
      tileCoord = [Math.floor(pos[0]) + sign[0], Math.floor(pos[1]) + sign[1]];
      tile = this.state.getTile(tileCoord[0], tileCoord[1]);
      i++;
      randDirInd++;
      layers = this.state.layer.getEnemiesAtCoordinate(tileCoord[0], tileCoord[1]);
      // double check coords!!!

      // note: we need a layer check here as well :(
      
    } while ((

            // tile is not full
            (tile === TileID.CRATE || tile === TileID.WALL) 

              // still directions to check
            

            // ensure we don't point oob
            || pos[0] + sign[0] < 0
            || (pos[1] + sign[1]) < 0
            || (pos[1] + sign[1]) >= 11

            // check for bombs
            || this.blockingLayerExists(tileCoord, layers))
          
          && i < 4);
    if (i >= 4) {
      randDir = PlayerInputState.MOVE_DOWN;
    }

    return randDir;
  }

  private blockingLayerExists(pos: [number, number], layers: [number, LayerInstance][]) {
    // allows our free direction check to also ensure no bombs exist at a location
    for (let l of layers) {
      let layer = l[1];
      if (layer.type === TileID.BOMB && layer.position[0] === pos[0] && layer.position[1] === pos[1]) {
        return true;
      }
    }

    return false;
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
      if (this.playermotion !== PlayerInputState.IDLE) {
        this.playerdirection = this.playermotion;
      }
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
    return this.maxBombCount;
  }

  getSpeed() {
    return this.speed * 2;
  }

  getRadius() {
    return this.radius;
  }

  getTermShock() {
    return this.termShockPos;
  }

  getShockSpeed() {
    return TERM_SHOCK_COEFF * 2 * this.time;
  }

  private shockFunc(t: number) {
    return (TERM_SHOCK_COEFF * t * t) + TERM_SHOCK_INIT_VELO * t - 25;
  }

  private handleBombPlace() {
    // max out
    if (this.bombCount >= this.maxBombCount) {
      return;
    }
    let bombPos : vec3 = [Math.round(this.playerpos[0]), Math.round(this.playerpos[1]), 0];
    // ensure there's no other bombs in that location (this shouldn't be a problem)
    for (let id of this.state.layer.keys()) {
      let inst = this.state.layer.get(id);
      let pos = inst.position;
      if (pos[0] === bombPos[0] && pos[1] === bombPos[1]) {
        return;
      }
    }

    let id = this.state.nextID++;
    let layer = new LayerInstance();
    layer.type = TileID.BOMB;
    layer.position = bombPos;

    this.state.layer.set(id, layer);
    this.bombCount++;

    this.bombCollision.add(id);
  }

  private handleBombDetonate() {
    let bombIDs = [];
    for (let id of this.state.layer.keys()) {
      let inst = this.state.layer.get(id);
      if (inst.type === TileID.BOMB) {
        bombIDs.push(id);
      }
    }

    let explosionTiles = [];
    for (let id of bombIDs) {
      // get the bomb's position
      // step along the x and y axes, placing explosions as we go
      // bomb radius is determined by distance
      // if we hit a wall, stop
      // if we hit a crate, destroy it and stop.

      // TODO: add special bombs which slightly tweak this behavior.
      let pos = this.state.layer.get(id).position;

      let dist = 0;


      while (dist <= this.radius) {
        let bomb = [pos[0] - dist, pos[1]];
        let det = this.createExplosion(bomb[0], bomb[1]);
        if (det === 0) {
          break;
        }
        
        explosionTiles.push(bomb);
        if (det === 1) {
          break;
        }
        dist++;
      }

      dist = 1;
      while (dist <= this.radius) {
        let bomb = [pos[0] + dist, pos[1]];
        let det = this.createExplosion(bomb[0], bomb[1]);
        if (det === 0) {
          break;
        }
        
        explosionTiles.push(bomb);
        if (det === 1) {
          break;
        }
        dist++;
      }

      dist = 1;
      while (dist <= this.radius) {
        let bomb = [pos[0], pos[1] - dist];
        let det = this.createExplosion(bomb[0], bomb[1]);
        if (det === 0) {
          break;
        }
        
        explosionTiles.push(bomb);
        if (det === 1) {
          break;
        }
        dist++;
      }

      dist = 1;
      while (dist <= this.radius) {
        let bomb = [pos[0], pos[1] + dist];
        let det = this.createExplosion(bomb[0], bomb[1]);
        if (det === 0) {
          break;
        }
        
        explosionTiles.push(bomb);
        if (det === 1) {
          break;
        }
        dist++;
      }
      

      this.state.layer.delete(id);

    }
    
    for (let tile of explosionTiles) {
      let delType = this.state.getTile(tile[0], tile[1]);
      this.state.setTile(tile[0], tile[1], TileID.EXPLOSION);

      // this does not work
      // we need this kind of free control though
      // store x, y, and tile
      this.detonations.add({
        "time": this.time,
        "x": tile[0],
        "y": tile[1]
      });

      // TODO: item spawning?
      if (delType === TileID.CRATE) {
        // spawn an item (low low chance of spawn)
        if (Math.random() < CRATE_POWERUP_CHANCE) {
          let inst = new LayerInstance();
          inst.type = this.getRandomCratePowerup();
          inst.position = [tile[0], tile[1], 0];
          this.state.layer.set(this.state.nextID++, inst);
        }
      } else if (delType === TileID.EMPTY) {
        // check for powerups
        let items = this.state.layer.getEnemiesAtCoordinate(tile[0], tile[1]);
        for (let item of items) {
          if (POWERUP_IDS.indexOf(item[1].type) !== -1) {
            this.state.layer.delete(item[0]);
          }
        }
      }
    }

    this.bombCount = 0;
    this.bombCollision.clear();
  }

  private getRandomCratePowerup() {
    let seed = Math.random();
    if (seed > 0.9) {
      return TileID.POWER_BOMB;
    } else if (seed > 0.7) {
      return TileID.POWER_RADIUS;
    } else {
      return TileID.POWER_SPEED;
    }
  }

  private getRandomKnightPowerup() {
    let seed = Math.random();
    // need to reduce the influence of these powerups
    // add an outline for more intense versions?
    // silver and gold if its more intense
    // and then reduce the intensity of the base ver
    if (seed > 0.925) {
      return TileID.POWER_BOMB;
    } else {
      return TileID.POWER_SPEED;
    }
  }

  // return 2 for continue, 1 for crate, 0 for wall.
  private createExplosion(x: number, y: number) : number {
    if (x < 0 || y < 0 || y >= 11) {
      return 0;
    }

    let tile = this.state.getTile(x, y);
    if (tile === TileID.WALL) {
      return 0;
    } else {
      return (tile !== TileID.CRATE ? 2 : 1);
    }
  }
}