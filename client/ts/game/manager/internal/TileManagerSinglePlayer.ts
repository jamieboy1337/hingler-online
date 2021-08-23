import { vec2 } from "gl-matrix";
import { TileFactoryStub } from "../../../../../test/stub/TileFactoryStub";
import { GameContext } from "../../../engine/GameContext";
import { GameObject } from "../../../engine/object/game/GameObject";
import { GamePBRModel } from "../../../engine/object/game/GamePBRModel";
import { GameMapState } from "../../GameMapState";
import { PlayerState } from "../../PlayerState";
import { GameTile } from "../../tile/GameTile";
import { TileFactory } from "../../tile/TileFactory";
import { TileGrid } from "../../TileGrid";
import { TileManager } from "../TileManager";

export class TileManagerSinglePlayer implements TileManager {
  private ctx: GameContext;
  private tilesDestroying: Set<GameTile>;
  private factory: TileFactory;
  private tilesCurrentGrid: TileGrid<GameTile>;
  private lastUpdateGrid: TileGrid<number>;
  private origin: [number, number];

  private xOffset: number;

  private players: Map<number, GameObject>;

  private floorPieces : Array<GamePBRModel>;

  // if a layer is removed, drop it.
  private layerInstances: Map<number, GameTile>;

  readonly root: GameObject;

  constructor(ctx: GameContext, mapTitle: string) {
    this.ctx = ctx;
    this.root = new GameObject(ctx);
    this.tilesDestroying = new Set();
    this.floorPieces = [];

    // bombs should probably be instanced but i dont care right now

    for (let i = 0; i < 5; i++) {
      this.floorPieces[i] = new GamePBRModel(ctx, "../res/grassworld.glb");
      this.root.addChild(this.floorPieces[i]);
    }

    this.lastUpdateGrid = new TileGrid();
    this.tilesCurrentGrid = new TileGrid();

    this.xOffset = 0;

    this.players = new Map();
    this.layerInstances = new Map();

    switch (mapTitle) {
      case "TEST_001":
        this.factory = new TileFactoryStub(ctx);
        break;
      default:
        console.warn("what");
    }
  }

  setTileOrigin(origin: [number, number]) {
    this.origin = origin;
    // adjust position of all tiles
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
      let guy = new GamePBRModel(this.ctx, "../res/chewingcharacter.glb");
      this.players.set(1, guy);
      this.root.addChild(guy);
    }

    let playerObject = this.players.get(1);
    offset[0] = (2 * playerInfo.position[0]) + this.origin[0];
    offset[1] = (2 * playerInfo.position[1]) + this.origin[1];
    playerObject.setPosition(offset[0], 0, offset[1]);

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
      if (!this.layerInstances.has(layerID)) {
        let tile = this.factory.getTileFromID(inst.type);
        this.layerInstances.set(layerID, tile);
        this.root.addChild(tile);
      }

      let obj = this.layerInstances.get(layerID);
      let offset = [inst.position[0] * 2 + this.origin[0], inst.position[1] * 2 + this.origin[1]];
      obj.setPosition(offset[0], inst.position[2], offset[1])
    }

    let delID = [];
    for (let id of this.layerInstances.keys()) {
      if (!state.layer.has(id)) {
        delID.push(id);
      }
    }

    for (let id of delID) {
      let inst = this.layerInstances.get(id);
      this.tilesDestroying.add(inst);
      this.layerInstances.delete(id);
      this.root.removeChild(inst.getId());
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
      this.xOffset += (Math.max(offset[0], 0) - this.xOffset) * t;
      this.root.setPosition(-this.xOffset, 0, 0);
    }

    this.handleFloorTiles(playerInfo.position);
  }

  private handleFloorTiles(playerPos: vec2) {
    let minTile = Math.max(Math.floor((playerPos[0] - 24) / 12), 0);
    for (let i = 0; i < 5; i++) {
      this.floorPieces[i].setPosition(this.origin[0] + 11 + (minTile * 24), 0, this.origin[1] + 10);
      minTile++;
    }
  }
}