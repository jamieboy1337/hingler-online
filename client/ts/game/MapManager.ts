import { ids } from "webpack";
import { TileFactoryStub } from "../../../test/stub/TileFactoryStub";
import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GamePBRModel } from "../engine/object/game/GamePBRModel";
import { GameConnectionManager } from "./GameConnectionManager";
import { InputManager, InputType, MOTION_INPUT } from "./manager/InputManager";
import { InputManagerImpl } from "./manager/internal/InputManagerImpl";
import { TileManagerSinglePlayer } from "./manager/internal/TileManagerSinglePlayer";
import { TileManager } from "./manager/TileManager";
import { PlayerInputState } from "./PlayerInputState";
import { GameTile } from "./tile/GameTile";
import { TileFactory } from "./tile/TileFactory";

/**
 * Handles creation of components pertaining to game connection.
 * Should this also contain the connection manager? probably :)
 */
export class MapManager extends GameObject {
  conn: GameConnectionManager;
  lastUpdate: Uint8Array;
  // contains all tiles at present.
  // in real gameconn: do not create the map manager until the connection is ready.
  tilesCurrent: Array<GameTile>;
  tilesDestroying: Set<GameTile>;
  factory: TileFactory;
  tilemgr: TileManager;
  inputmgr: InputManager;
  inputMap: Map<PlayerInputState, number>;
  players: Map<number, GameObject>;
  time: number;
  constructor(ctx: GameContext, conn: GameConnectionManager) {
    super(ctx);
    this.conn = conn;
    this.lastUpdate = null;
    this.tilesCurrent = [];
    this.tilesDestroying = new Set();
    this.inputMap = new Map();
    this.time = 0;
    this.tilemgr = new TileManagerSinglePlayer(ctx, this.conn.getMapTitle());
    this.inputmgr = new InputManagerImpl();
    this.players = new Map();
    this.addChild(this.tilemgr.root);
    this.tilemgr.root.setPosition(0, 0, 0);

    this.inputmgr.setKey(PlayerInputState.MOVE_UP, "ArrowUp");
    this.inputmgr.setKey(PlayerInputState.MOVE_LEFT, "ArrowLeft");
    this.inputmgr.setKey(PlayerInputState.MOVE_RIGHT, "ArrowRight");
    this.inputmgr.setKey(PlayerInputState.MOVE_DOWN, "ArrowDown");

    switch(this.conn.getMapTitle()) {
      case "TEST_001":
        this.factory = new TileFactoryStub(this.getContext());
      default:
        console.warn("what");
    }
  }

  protected update() {
    this.time += this.getContext().getDelta();
    let state = this.conn.getMapState();
    this.tilemgr.setTileOrigin([Math.max(-state.dims[0] + 1, -11), -state.dims[1] + 1]);
    this.tilemgr.updateTiles(this.conn.getMapState(), this.conn.getPlayerList());
    // get input manager state
    let inputs = this.inputmgr.getInputState();
    for (let input of inputs) {
      if (this.inputMap.has(input)) {
        continue;
      }

      this.inputMap.set(input, this.time);
    }

    let deletedInputs = [];
    for (let input of this.inputMap.keys()) {
      if (!inputs.has(input)) {
        deletedInputs.push(input);
      }
    }

    for (let input of deletedInputs) {
      this.inputMap.delete(input);
    }
    
    // use time to sort inputs via a map
    let time = -1;
    let inputValue : PlayerInputState = PlayerInputState.IDLE;
    for (let input of this.inputMap) {
      // use most recent directional input
      if (MOTION_INPUT.indexOf(input[0]) !== -1 && time < input[1]) {
        time = input[1];
        inputValue = input[0];
      }
    }

    this.conn.sendInput(inputValue);
    // send current input state to the thing

    // let players = this.conn.getPlayerList();
    // for (let id of players.keys()) {
    //   if (!this.players.has(id)) {
    //     let guy = new GamePBRModel(this.getContext(), "../res/chewingcharacter.glb");
    //     this.players.set(id, guy);
    //     this.addChild(guy);
    //   }

    //   let player = this.players.get(id);
    //   let playerInfo = players.get(id);
    //   player.setPosition((2 * playerInfo.position[0]) - state.dims[0] + 1, 0, (2 * playerInfo.position[1]) - state.dims[1] + 1)
    // }
  }
}