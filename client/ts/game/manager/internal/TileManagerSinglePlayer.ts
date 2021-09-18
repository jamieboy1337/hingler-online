import { vec2 } from "gl-matrix";
import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { Task } from "../../../../../ts/util/task/Task";
import { GameContext } from "../../../engine/GameContext";
import { Model } from "../../../engine/model/Model";
import { GameCamera } from "../../../engine/object/game/GameCamera";
import { GameObject } from "../../../engine/object/game/GameObject";
import { GamePBRModel } from "../../../engine/object/game/GamePBRModel";
import { TerminationShock } from "../../field/TerminationShock";
import { GameConnectionManager } from "../../GameConnectionManager";
import { GameMapState } from "../../GameMapState";
import { PlayerGameObject } from "../../PlayerGameObject";
import { PlayerInputState } from "../../PlayerInputState";
import { PlayerState } from "../../PlayerState";
import { GameTile } from "../../tile/GameTile";
import { LavaTileFactory } from "../../tile/instancefactory/LavaTileFactory";
import { LayerInstance } from "../../tile/LayerInstance";
import { TileFactory } from "../../tile/TileFactory";
import { TileGrid } from "../../TileGrid";
import { FieldManager } from "../FieldManager";
import { TileManager } from "../TileManager";
import { FieldManagerSinglePlayer } from "./FieldManagerSinglePlayer";

const TILES_PER_FIELD = 24;

const LAVA_BARRIER = 240;

// todo: lots of redundancy between this and what the multiplayer ver would look like
// before creating a multiplayer, factor it out!
export class TileManagerSinglePlayer implements TileManager {
  private ctx: GameContext;
  private tilesDestroying: Set<GameTile>;
  private factory: TileFactory;
  private factoryLava: TileFactory;
  private tilesCurrentGrid: TileGrid<GameTile>;
  private lastUpdateGrid: TileGrid<number>;
  private fieldIndex: number;

  private shockLoc: number;

  private fieldmgr: FieldManager;
  private origin: [number, number];

  private xOffset: number;

  private players: Map<number, PlayerGameObject>;
  private fieldPieces : Array<GameObject>;

  // if a layer is removed, drop it.
  private layerInstances: Map<number, GameTile>;

  private deathDelta: number;

  readonly root: GameObject;

  private termShock: TerminationShock;

  constructor(ctx: GameContext, cam: GameCamera, field?: FieldManager) {
    this.ctx = ctx;

    this.shockLoc = -100;

    // :sade:
    if (field) {
      this.fieldmgr = field;
    } else {
      this.fieldmgr = new FieldManagerSinglePlayer(ctx, 11);
    }

    this.root = new GameObject(ctx);
    let shockScene = ctx.getGLTFLoader().loadAsGLTFScene("../res/terminationshock.glb");

    let shockSceneTask : Task<Model> = new Task();
    shockScene.then(scene => {
      shockSceneTask.resolve(scene.getModel("explosion"));
    });

    this.termShock = new TerminationShock(ctx, shockSceneTask.getFuture(), cam);
    this.root.addChild(this.termShock);

    this.tilesDestroying = new Set();
    this.fieldPieces = new Array(3);
    this.fieldIndex = -1;

    this.deathDelta = 0;

    // bombs should probably be instanced but i dont care right now

    this.lastUpdateGrid = new TileGrid();
    this.tilesCurrentGrid = new TileGrid();

    this.xOffset = 0;

    this.players = new Map();
    this.layerInstances = new Map();
    this.factory = new TileFactoryStub(ctx);

    this.factoryLava = new LavaTileFactory(ctx);
  }

  clear() {
    for (let inst of this.layerInstances) {
      this.root.removeChild(inst[1].getId());
    }

    this.layerInstances.clear();

    this.lastUpdateGrid = new TileGrid();
    // todo: make tilegrid iterable

    for (let tile of this.tilesDestroying) {
      this.root.removeChild(tile.getId());
    }
    
    this.tilesDestroying.clear();
    
  }

  setTileOrigin(origin: [number, number]) {
    this.origin = origin;
    // adjust position of all tiles
  }

  getPlayerPosition(id: number) {
    if (this.players.has(id)) {
      return this.players.get(id).getGlobalPosition() as [number, number, number];
    }

    return [0, 0, 0] as [number, number, number];
  }

  setTermShockPosition(pos: number) {
    this.shockLoc = pos;
  }

  updateTiles(state: GameMapState, players: Map<number, PlayerState>) {
    // figure out where the player is (later)
    // fetch only the tiles around them
    // update those
    // drop the rest on some even ratio
    let offset : vec2 = vec2.create();
    let playerInfo = players.get(1);
    if (!players.has(1)) {
      throw Error("Single player not available :(");
    }
    
    if (!this.players.has(1)) {
      let guy = new PlayerGameObject(this.ctx);
      this.players.set(1, guy);
      this.root.addChild(guy);
    }
    
    // configure our blur effect
    this.termShock.setPosition(this.shockLoc * 2 + this.origin[0], 0, 0);
    let blurMag = 1.0 - Math.min(Math.max((playerInfo.position[0] - this.shockLoc - 5) / 10, 0), 1);
    this.termShock.setBlur(0.05 + (blurMag * 0.5));

    let playerObject = this.players.get(1);
    offset[0] = (2 * playerInfo.position[0]) + this.origin[0];
    offset[1] = (2 * playerInfo.position[1]) + this.origin[1];
    if (playerInfo.dead) {
      playerObject.setRotationEuler(0, 90, 0);
    } else {
      switch (playerInfo.lastInput) {
        case PlayerInputState.MOVE_DOWN:
          playerObject.setRotationEuler(0, 0, 0);
          break;
        case PlayerInputState.MOVE_LEFT:
          playerObject.setRotationEuler(0, 270, 0);
          break;
        case PlayerInputState.MOVE_UP:
          playerObject.setRotationEuler(0, 180, 0);
          break;
        case PlayerInputState.MOVE_RIGHT:
        default:
          playerObject.setRotationEuler(0, 90, 0);
      }
    }
    playerObject.setPosition(offset[0], 0, offset[1]);

    if (playerInfo.dead) {
      playerObject.getSpot().intensity = Math.min(this.deathDelta * 4, 1);
      if (this.shockLoc - (playerInfo.position[0]) > 4.0) {
        playerObject.getSpot().intensity = 0;
      }
      this.deathDelta += this.ctx.getDelta();
      playerObject.setPivotRotation(Math.min(this.deathDelta * 90, 90));
    } else {
      this.deathDelta = 0;
      playerObject.getSpot().intensity = 0;
      playerObject.setPivotRotation(0);
    }

    // read around player
    let tiles = state.fetchTiles(Math.floor(playerInfo.position[0] - 25), Math.floor(playerInfo.position[1] - 25), 50, 50);
    // fetch only around the player
    // clear outside of a range
    let xOrigin = tiles.origin[0];
    let yOrigin = tiles.origin[1];
    let xDims = tiles.dims[0] + xOrigin;
    let yDims = tiles.dims[1] + yOrigin;
    
    for (let i = xOrigin; i < xDims; i++) {
      for (let j = yOrigin; j < yDims; j++) {
        let tileID = tiles.getTile(i, j);
        if (tileID !== this.lastUpdateGrid.getTile(i, j)) {
          let tile = this.tilesCurrentGrid.getTile(i, j);
          if (tile) {
            console.log("the moment");
            tile.destroyTile();
            this.tilesDestroying.add(tile);
          }

          let offset = [i * 2 + this.origin[0], j * 2 + this.origin[1]];
          // origin is center of (0, 0)
          // we want to place our tiles at the corner of (5, 5) and (6, 6)
          let newTile = this.factory.getTileFromID(tileID);
          
          if (newTile !== null) {
            newTile.setPosition(offset[0], 0, offset[1]);
            this.root.addChild(newTile);
          }

          this.tilesCurrentGrid.setTile(i, j, newTile);
          this.lastUpdateGrid.setTile(i, j, tileID);
        }
      }
    }

    let clearOrigin = this.tilesCurrentGrid.getOrigin();


    for (let i = clearOrigin[0]; i < xOrigin; i++) {
      for (let j = 0; j < tiles.dims[1]; j++) {
        let tileCur = this.tilesCurrentGrid.getTile(i, j);
        if (tileCur) {
          this.root.removeChild(tileCur.getId());
        }

        this.tilesCurrentGrid.setTile(i, j, null);
        this.lastUpdateGrid.setTile(i, j, 0);
      }
    }

    // all tiles which fall outside the range specified by the tile manager should be cleared
    // the issue right now is that we're clearing things which we don't expect to i think
    // on set, the size of our game field is increased

    let gridMax = this.tilesCurrentGrid.dims[0] + clearOrigin[0];
    for (let i = xDims; i < gridMax; i++) {
      for (let j = 0; j < this.tilesCurrentGrid.dims[1]; j++) {
        let tileCurFar = this.tilesCurrentGrid.getTile(i, j);
        if (tileCurFar) {
          this.root.removeChild(tileCurFar.getId());
        }

        this.tilesCurrentGrid.setTile(i, j, null);
        this.lastUpdateGrid.setTile(i, j, 0);
      }
    }

    this.tilesCurrentGrid.setOrigin(xOrigin, yOrigin);
    this.lastUpdateGrid.setOrigin(xOrigin, yOrigin);
    this.tilesCurrentGrid.setDims(tiles.dims[0], tiles.dims[1]);
    this.lastUpdateGrid.setDims(tiles.dims[0], tiles.dims[1]);

    for (let layerID of state.layer.keys()) {
      let inst = state.layer.get(layerID);
      let dist = Math.abs(inst.position[0] - playerInfo.position[0]);
      if (dist < 30) {
        if (!this.layerInstances.has(layerID)) {
          let tile = this.factory.getTileFromID(inst.type);
          this.layerInstances.set(layerID, tile);
          this.root.addChild(tile);
        }
        
        let obj = this.layerInstances.get(layerID);
        let offset = [inst.position[0] * 2 + this.origin[0], inst.position[1] * 2 + this.origin[1]];
        obj.setPosition(offset[0], inst.position[2], offset[1])
      }
    }

    for (let enemyID of state.enemy.keys()) {
      let inst = state.enemy.get(enemyID);
      let dist = Math.abs(inst.position[0] - playerInfo.position[0]);
      if (dist < 30) {
        if (!this.layerInstances.has(enemyID)) {
          let tile = this.factory.getTileFromID(inst.type);
          this.layerInstances.set(enemyID, tile);
          this.root.addChild(tile);
        }
        
        let obj = this.layerInstances.get(enemyID);
        let offset = [inst.position[0] * 2 + this.origin[0], inst.position[1] * 2 + this.origin[1]];
        obj.setPosition(offset[0], inst.position[2], offset[1]);
        switch (inst.direction) {
          case PlayerInputState.MOVE_LEFT:
            obj.setRotationEuler(0, 180, 0);
            break;
          case PlayerInputState.MOVE_RIGHT:
            obj.setRotationEuler(0, 0, 0);
            break;
          case PlayerInputState.MOVE_UP:
            obj.setRotationEuler(0, 90, 0);
            break;
          case PlayerInputState.MOVE_DOWN:
          default:
            obj.setRotationEuler(0, 270, 0);
            break;
        }
      }

    }

    let delID = [];
    for (let id of this.layerInstances.keys()) {
      if (!state.layer.has(id) && !state.enemy.has(id)) {
        delID.push(id);
      } else {
        // todo: avoid simulating enemies which are outside of some visible range (40 tiles?)
        // having the tiled map will help with this a ton
        let inst : LayerInstance = (state.layer.has(id) ? state.layer.get(id) : state.enemy.get(id));
        let dist = Math.abs(inst.position[0] - playerInfo.position[0]);
        if (dist > 31) {
          delID.push(id);
        }
      }
    }

    for (let id of delID) {
      let inst = this.layerInstances.get(id);
      this.tilesDestroying.add(inst);
      this.layerInstances.delete(id);
      inst.destroyTile();
    }

    // i want to set the origin on these to something more reasonable
    // because its too fucking many tiles to sort through lol
    
    let deadTiles = [];
    for (let tile of this.tilesDestroying) {
      if (tile.isClean()) {
        this.root.removeChild(tile.getId());
        deadTiles.push(tile);
      }
    }

    for (let tile of deadTiles) {
      this.tilesDestroying.delete(tile);
    }

    // expect the player to have ID 1
    // if that ID isn't there, something is wrong.
    // (codependency: whatever dude idc)

    // create tiles based on player position

    // dependence on delta cycle which may not reliably update
    // we could allow a get sys time function and calculate it ourselves
    if (this.xOffset > 0 || offset[0] > 0) {
      let t = 1.0 - Math.pow(0.01, this.ctx.getDelta());
      if (Math.abs(this.xOffset - Math.max(offset[0])) > 12) {
        this.xOffset = Math.max(offset[0], 0);
      } else {
        this.xOffset += (Math.max(offset[0], 0) - this.xOffset) * t;
      }

      this.root.setPosition(-this.xOffset, 0, 0);
    }

    this.handleFloorTiles(playerInfo.position);
    this.handleFieldTiles(playerInfo.position, -tiles.dims[1], tiles.dims[1]);
  }

  private handleFieldTiles(playerPos: vec2, yTop: number, yBottom: number) {
    let fieldIndex = Math.max(Math.round(playerPos[0] / 24) - 1, 0);
    if (fieldIndex !== this.fieldIndex) {
      // update models, update positions
      for (let i = 0; i < this.fieldPieces.length; i++) {
        let piece = this.fieldmgr.getFieldModel(fieldIndex + i);
        if (this.fieldPieces[i]) {
          this.root.removeChild(this.fieldPieces[i].getId());
        }

        this.root.addChild(piece);
        this.fieldPieces[i] = piece;
        piece.setPosition((fieldIndex + i) * (48.0) + this.origin[0] - 1, 0, 0);
      }
    }

    this.fieldIndex = fieldIndex;
  }

  private handleFloorTiles(playerPos: vec2) {
    // figure out floor tile :3
    // disjoint between floor tiles and field tiles
    // delegate responsibility to field tiles???
    // let minTile = Math.max(Math.floor((playerPos[0] - 24) / 12), 0);
    // for (let i = 0; i < 5; i++) {
    //   this.floorPieces[i].setPosition(this.origin[0] + 11 + (minTile * 24), 0, this.origin[1] + 10);
    //   minTile++;
    // }
  }
}