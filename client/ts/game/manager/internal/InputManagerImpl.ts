import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { PlayerInputState } from "../../PlayerInputState";
import { InputManager, InputType, KeyListenerID } from "../InputManager";

export class InputManagerImpl implements InputManager {
  private keyToInput: Map<string, PlayerInputState>;
  private inputToKey: Map<PlayerInputState, Set<string>>;

  private listeners: Map<KeyListenerID, (e: KeyboardEvent) => void>;
  private listenerCount: KeyListenerID;

  private pressedKeys: Set<string>;

  private touchMap: Map<number, Touch>;
  private dirTouch: number;

  private touchDir: PlayerInputState;

  private touchImg: HTMLElement;

  private bomb: boolean;
  private bombID: number;
  private detonate: boolean;
  private detonateID: number;

  private ctx: GameContext;


  constructor(ctx: GameContext) {
    this.ctx = ctx;

    this.keyToInput  = new Map();
    this.inputToKey  = new Map();
    this.listeners   = new Map();
    this.listenerCount = 0;
    this.pressedKeys = new Set();

    this.touchMap = new Map();
    this.dirTouch = -1;
    this.touchDir = PlayerInputState.IDLE;

    this.bomb = false;
    this.detonate = false;
    this.bombID = -1;
    this.detonateID = -1;

    this.touchImg = document.getElementById("touch-direction");

    addEventListener("keydown", this.handlekeydown_.bind(this));
    addEventListener("keyup", this.handlekeyup_.bind(this));

    document.body.addEventListener("touchstart", this.handletouchstart_.bind(this), {capture: true, passive: true});

    // add touch listeners to our buttons
    let dir = this.touchImg;

    dir.addEventListener("touchstart", this.handletouchdirinput_.bind(this), {capture: true, passive: true});
    document.body.addEventListener("touchmove", this.updatetouchids_.bind(this), {capture: true, passive: false});
    document.body.addEventListener("touchend", this.removetouchids_.bind(this), true);
  
    document.getElementById("touch-detonate").addEventListener("touchstart", (e) => { console.log("register touch start"); this.detonate = true; for (let t of e.changedTouches) {this.detonateID = t.identifier}}, {capture: true, passive: true});
    document.getElementById("touch-bomb").addEventListener("touchstart", (e) => { console.log("register touch start"); this.bomb = true; for (let t of e.changedTouches) {this.bombID = t.identifier}}, {capture: true, passive: true});
  
    if (this.ctx.mobile) {
      document.getElementById("touch-controls").classList.remove("hidden");
    }
  }

  private handletouchstart_(e: TouchEvent) {
    document.getElementById("touch-controls").classList.remove("hidden");
    for (let touch of e.changedTouches) {
      this.touchMap.set(touch.identifier, touch);
    }
  }

  private handletouchdirinput_(e: TouchEvent) {
    // if they're simultaneous, just grab one
    console.log("this is the body touch start -- might be the issue?");
    for (let touch of e.changedTouches) {
      this.dirTouch = touch.identifier;
      this.setTouchZone(touch);
    }
  }

  private updatetouchids_(e: TouchEvent) {
    e.preventDefault();
    for (let touch of e.changedTouches) {
      this.touchMap.set(touch.identifier, touch);
      if (this.dirTouch === touch.identifier) {
        this.handleDirTouch_(touch);
      }
    }
  }

  private handleDirTouch_(e: Touch) {
    this.setTouchZone(e);
  }

  private setTouchZone(e: Touch) {
    let rect = this.touchImg.getBoundingClientRect();
    let center = [rect.x + rect.width / 2, rect.y + rect.height / 2];
    let dist = [e.clientX - center[0], e.clientY - center[1]];

    const ONE_SQRT_TWO = 1.0 / Math.sqrt(2);
    const M_PI_2 = Math.PI / 2;
    // rotate 45 degrees to make math easier
    dist = [ONE_SQRT_TWO * dist[0] - ONE_SQRT_TWO * dist[1], ONE_SQRT_TWO * dist[0] + ONE_SQRT_TWO * dist[1]];

    let theta = Math.atan2(dist[1], dist[0]);

    if ((Math.pow(dist[0], 2) + Math.pow(dist[1], 2)) > 400) {
      // 20 px radius dead zone
      if (theta < -M_PI_2) {
        this.touchDir = PlayerInputState.MOVE_LEFT;
      } else if (theta < 0) {
        this.touchDir = PlayerInputState.MOVE_UP;
      } else if (theta < M_PI_2) {
        this.touchDir = PlayerInputState.MOVE_RIGHT;
      } else {
        this.touchDir = PlayerInputState.MOVE_DOWN;
      }
    }
  }

  private removetouchids_(e: TouchEvent) {
    for (let touch of e.changedTouches) {
      this.touchMap.delete(touch.identifier);
      if (this.dirTouch === touch.identifier) {
        this.dirTouch = -1;
        this.touchDir = PlayerInputState.IDLE;
      } else if (this.bombID === touch.identifier) {
        this.bombID = -1;
        this.bomb = false;
      } else if (this.detonateID === touch.identifier) {
        this.detonateID = -1;
        this.detonate = false;
      }
    }
  }

  private handlekeydown_(e: KeyboardEvent) {
    document.getElementById("touch-controls").classList.add("hidden");
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
    if (this.touchDir !== PlayerInputState.IDLE) {
      res.add(this.touchDir);
    }

    if (this.bomb) {
      res.add(PlayerInputState.BOMB_PLACE);
    }

    if (this.detonate) {
      res.add(PlayerInputState.BOMB_DETONATE);
    }

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