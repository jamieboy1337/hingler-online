/**
 * Represents an input which can be sent to the server.
 * Temporary, while io netcode is in place.
 */
export enum PlayerInputState {
  IDLE,
  MOVE_LEFT,
  MOVE_RIGHT,
  MOVE_UP,
  MOVE_DOWN,
  STOP
};