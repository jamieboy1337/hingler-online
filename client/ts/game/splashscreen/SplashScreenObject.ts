import { MapSceneTest } from "../../../../test/mapscenetest";
import { GameContext } from "../../engine/GameContext";
import { GameObject } from "../../engine/object/game/GameObject";
import { SceneSwap } from "../../engine/object/scene/SceneSwap";

export class SplashScreenObject extends GameObject {
  private bg: HTMLImageElement;
  private starttext: HTMLElement;
  private windowcb: () => void;
  private delta: number;
  private ready: boolean;

  private swap: SceneSwap;
  private swapGood: boolean;

  constructor(ctx: GameContext) {
    super(ctx);
    this.delta = 0;
    this.swapGood = false;
    this.bg = new Image();
    this.bg.src = "../res/splashscreen.jpg";
    this.bg.classList.add("splash-screen");

    document.getElementById("overlay").appendChild(this.bg);
    this.starttext = document.createElement("p");
    this.starttext.classList.add("start-text");
    this.starttext.textContent = "PRESS START";

    document.body.appendChild(this.starttext);
    this.windowcb = this.handleSceneSwap.bind(this);

    this.swap = this.getContext().loadNewScene(new MapSceneTest());

    // handle click and touch
    window.addEventListener("click", this.windowcb);
    window.addEventListener("touchstart", this.windowcb);
  }

  update() {
    this.delta += this.getContext().getDelta();
    // probably do this better :(
    if (!this.ready) {
      console.log(this.delta);
      this.bg.style.filter = `opacity(${Math.min(this.delta, 1.0)})`;
      this.ready = this.ready || (this.delta >= 1.0);
    }

    if (this.swapGood && this.swap.getFractionLoaded() > 0.999) {
      this.swap.swap().then(() => {
        document.body.removeChild(this.starttext);
      });
    }
  }

  private handleSceneSwap() {
    if (!this.ready) {
      this.ready = true;
      this.bg.style.filter = "opacity(1)";
    } else if (this.ready) {
      // touch to start
      document.getElementById("hud").classList.remove("hidden");
      console.log("swap is ready to go once loaded");
      this.swapGood = true;
    }
  }
}