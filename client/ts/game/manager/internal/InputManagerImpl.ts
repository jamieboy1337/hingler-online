import { PlayerInputState } from "../../PlayerInputState";
import { InputManager, InputType, KeyListenerID } from "../InputManager";

export class InputManagerImpl implements InputManager {
  private keyToInput: Map<string, PlayerInputState>;
  private inputToKey: Map<PlayerInputState, Set<string>>;

  private listeners: Map<KeyListenerID, (e: KeyboardEvent) => void>;
  private listenerCount: KeyListenerID;

  private pressedKeys: Set<string>;
  constructor() {
    this.keyToInput  = new Map();
    this.inputToKey  = new Map();
    this.listeners   = new Map();
    this.listenerCount = 0;
    this.pressedKeys = new Set();

    addEventListener("keydown", this.handlekeydown_.bind(this));
    addEventListener("keyup", this.handlekeyup_.bind(this));
  }

  private handlekeydown_(e: KeyboardEvent) {
    this.pressedKeys.add(e.code);
  }

  private handlekeyup_(e: KeyboardEvent) {
    this.pressedKeys.delete(e.code);
  }

  setKey(input: PlayerInputState, keycode: string) {
    this.keyToInput.set(keycode, input);
    if (!this.inputToKey.has(input)) {
      this.inputToKey.set(input, new Set());
    }

    this.inputToKey.get(input).add(keycode);
  }

  unsetKey(keycode: string) {
    if (this.keyToInput.has(keycode)) {
      let input = this.keyToInput.get(keycode);
      this.keyToInput.delete(keycode);
      if (!this.inputToKey.has(input) || !this.inputToKey.get(input).has(keycode)) {
        throw Error("Invariant invalidated");
      }

      this.inputToKey.get(input).delete(keycode);
    }
  }

  getKeyBindings(input: PlayerInputState) {
    if (this.inputToKey.has(input)) {
      let res : Set<string> = new Set();
      for (let i of this.inputToKey.get(input)) {
        res.add(i);
      }

      return res;
    }

    return new Set() as Set<string>;
  }

  getKeyState(keycode: string) {
    return this.pressedKeys.has(keycode);
  }

  getInputState() {
    let res : Set<PlayerInputState> = new Set();
    for (let key of this.pressedKeys) {
      if (this.keyToInput.has(key)) {
        res.add(this.keyToInput.get(key));
      }
    }

    return res;
  }

  registerKeyListener(func: (e: KeyboardEvent) => void) {
    let id = this.listenerCount++;
    this.listeners.set(id, func);
    return id as KeyListenerID;
  }

  removeKeyListener(l: KeyListenerID) {
    if (this.listeners.has(l)) {
      this.listeners.delete(l);
    }
  }
}