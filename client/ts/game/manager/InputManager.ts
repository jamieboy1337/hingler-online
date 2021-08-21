import { PlayerInputState } from "../PlayerInputState";

export enum InputType {
  MOVE_LEFT,
  MOVE_RIGHT,
  MOVE_UP,
  MOVE_DOWN
};

// TODO: come up with a good way to represent gamepads and keyboards and other devices etc.
// how would we want to change input?

// add the ability to get key states
// check if a key is pressed
// additionally let components subscribe to key presses

export type KeyListenerID = number;

export const MOTION_INPUT = [PlayerInputState.MOVE_DOWN, PlayerInputState.MOVE_LEFT, PlayerInputState.MOVE_RIGHT, PlayerInputState.MOVE_UP];

export interface InputManager {
  /**
   * Sets a particular input to be triggered when the specified key is pressed.
   * @param input - the input we want to trigger.
   * @param keycode - the code for the key which will trigger it.
   */ 
  setKey(input: PlayerInputState, keycode: string) : void;

  /**
   * Unsets a particular keycode from an input.
   * @param input - the input in question.
   * @param keycode - the keycode associated with that input which we want to remove.
   */
  unsetKey(keycode: string) : void;

  /**
   * Fetches all keycodes associated with a particular input.
   * @param input - the input in question
   */
  getKeyBindings(input: PlayerInputState) : Set<string>;

  /**
   * Returns the state of a key.
   * @param keycode - the key in question
   * @returns true if the key is pressed, false otherwise.
   */
  getKeyState(keycode: string) : boolean;

  /**
   * Fetches the current input state, based on currently bound inputs.
   */
  getInputState() : Set<PlayerInputState>;

  /**
   * Registers a listener which will receive every key update.
   * @param func - the listener in question.
   */
  registerKeyListener(func: (e: KeyboardEvent) => void) : KeyListenerID;
  removeKeyListener(l: KeyListenerID) : void;

}