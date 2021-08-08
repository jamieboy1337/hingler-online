import { GameMapState } from "./GameMapState";
import { PlayerInputState } from "./PlayerInputState";
import { PlayerState } from "./PlayerState";
import { TileFactory } from "./tile/TileFactory";

// interface which facilitates game state management

// todo: create a basic demo which makes use of this
// use mapmanager to send and receive input btwn this component
// control player icons, ignore tiles for now
export interface GameConnectionManager {
  /**
   * @returns a GameMapState objects representing the current map state.
   */
  getMapState() : GameMapState;
  
  /**
   * @returns an array of all players.
   */
  getPlayerList() : Map<number, PlayerState>;

  /**
   * @returns the name of this map.
   * (TODO: use this to determine which tile factory to use)
   */
  getMapTitle() : string;

  /**
   * Sends an input to the game server.
   * @param i - the input in question
   */  
  sendInput(i: PlayerInputState) : void;
}