import { vec2, vec3 } from "gl-matrix";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";
import { SinglePlayerMapState } from "./manager/internal/SinglePlayerMapState";
import { PlayerInputState } from "./PlayerInputState";
import { PlayerState } from "./PlayerState";
import { TileID } from "./tile/TileID";
import { shadersStillCompiling } from "../engine/gl/ShaderProgramBuilder";
import { LayerInstance } from "./tile/LayerInstance";

export const PLAYER_MOTION_STATES = [PlayerInputState.MOVE_LEFT, PlayerInputState.MOVE_RIGHT, PlayerInputState.MOVE_UP, PlayerInputState.MOVE_DOWN, PlayerInputState.IDLE];

const knightSpeed = 1.5;
const BOMB_RADIUS = 1;

const TERM_SHOCK_COEFF = (1 / 450);
const TERM_SHOCK_INIT_VELO = 1.0;

const BASE_SPEED_POWERUP = 0.1;

// todo: draw colored outline around stronger tiles, brighten them?


// todo: add grades of powerups
// higher grades = better adders
const CRATE_POWERUP_CHANCE = .1;
const KNIGHT_POWERUP_CHANCE = .6;

const BASE_SPEED = 3.0;

interface ExplosionRecord {
  time: number;
  x: number;
  y: number;
}

interface KnightState {
  direction: PlayerInputState;
}

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
  }

  get killerIsDead() {
    return this.playerdead;
  }

  reset() {
    this.playerpos = [0, 0];
    this.bombCount = 0;
    this.knightKills = 0;
    this.maxBombCount = 1;
    this.speed = BASE_SPEED;
    this.radius = 1;
    this.playerdead = false;
    this.state = new SinglePlayerMapState(11);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < this.state.dims[1]; j++) {
        this.state.setTile(i, j, TileID.EMPTY);
      }
    }

    this.time = 0;
  }

  getKnightKillCount() {
    return this.knightKills;
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
    
    // clear explosions
    this.clearExplosions();


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

        // perform an explosion check on our knight -- are they on an explosion tile?

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
          if (roll < KNIGHT_POWERUP_CHANCE) {
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