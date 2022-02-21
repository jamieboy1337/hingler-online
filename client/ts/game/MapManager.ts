import { GameContext } from "../../../hingler-party/client/ts/engine/GameContext";
import { GameObject } from "../../../hingler-party/client/ts/engine/object/game/GameObject";
import { TileFactoryStub } from "../../../test/stub/TileFactoryStub";
import { GameConnectionManager } from "./GameConnectionManager";
import { FieldManager } from "./manager/FieldManager";
import { InputManager, InputType, MOTION_INPUT } from "./manager/InputManager";
import { FieldManagerSinglePlayer } from "./manager/internal/FieldManagerSinglePlayer";
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
  factory: TileFactory;
  tilemgr: TileManager;
  inputmgr: InputManager;
  inputMap: Map<PlayerInputState, number>;
  players: Map<number, GameObject>;
  time: number;
  constructor(ctx: GameContext, conn: GameConnectionManager, input?: InputManager, tile?: TileManager) {
    super(ctx);
    this.conn = conn;
    this.lastUpdate = null;
    this.inputMap = new Map();
    this.time = 0;

    if (!tile) {
      this.tilemgr = new TileManagerSinglePlayer(ctx, null, null);
    } else {
      this.tilemgr = tile;
    }

    if (!input) {
      this.inputmgr = new InputManagerImpl(ctx);
    } else {
      this.inputmgr = input;
    }
    
    this.players = new Map();
    this.addChild(this.tilemgr.root);
    this.tilemgr.root.setPosition(0, 0, 0);

    this.inputmgr.setKey(PlayerInputState.MOVE_UP, "KeyW");
    this.inputmgr.setKey(PlayerInputState.MOVE_LEFT, "KeyA");
    this.inputmgr.setKey(PlayerInputState.MOVE_RIGHT, "KeyD");
    this.inputmgr.setKey(PlayerInputState.MOVE_DOWN, "KeyS");
    this.inputmgr.setKey(PlayerInputState.BOMB_PLACE, "KeyJ");
    this.inputmgr.setKey(PlayerInputState.PIPE_BOMB_PLACE, "KeyI");
    this.inputmgr.setKey(PlayerInputState.BOMB_DETONATE, "Space");

    switch(this.conn.getMapTitle()) {
      case "TEST_001":
        this.factory = new TileFactoryStub(this.getContext());
      default:
        console.warn("what");
    }
  }

  clear() {
    this.tilemgr.clear();
  }

  protected update() {
    this.time += this.getContext().getDelta();
    let state = this.conn.getMapState();
    this.tilemgr.setTileOrigin([Math.max(-state.dims[0] + 1, -11), -state.dims[1] + 1]);
    this.tilemgr.updateTiles(this.conn.getMapState(), this.conn.getPlayerList());
    // get input manager state
    let inputs = this.inputmgr.getInputState();

    // create an array of inputs which are triggered as a "delta"
    // for each one, duplicate this handling
    if (inputs.has(PlayerInputState.BOMB_PLACE) && !this.inputMap.has(PlayerInputState.BOMB_PLACE)) {
      this.conn.sendInput(PlayerInputState.BOMB_PLACE);
    }

    if (inputs.has(PlayerInputState.BOMB_DETONATE) && !this.inputMap.has(PlayerInputState.BOMB_DETONATE)) {
      this.conn.sendInput(PlayerInputState.BOMB_DETONATE);
    }

    if (inputs.has(PlayerInputState.PIPE_BOMB_PLACE) && !this.inputMap.has(PlayerInputState.PIPE_BOMB_PLACE)) {
      this.conn.sendInput(PlayerInputState.PIPE_BOMB_PLACE);
    }

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
  }

  getPlayerPosition(id: number) {
    return this.tilemgr.getPlayerPosition(id);
  }
}