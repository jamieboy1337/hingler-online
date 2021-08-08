import { PlayerInputState } from "./PlayerInputState";

export interface PlayerState {
  // name associated with this player
  name: string;

  // position of our player, relative to the map dimensions.
  position: [number, number];

  // the current input, pertaining to the player's actions
  lastInput: PlayerInputState;

  // bomb list? not yet

  // TODO: add action state, etc.
}