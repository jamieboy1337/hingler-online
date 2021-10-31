import { GameContext } from "../../hingler-party/client/ts/engine/GameContext";
import { EngineContext } from "../../hingler-party/client/ts/engine/internal/EngineContext";
import { GameObject } from "../../hingler-party/client/ts/engine/object/game/GameObject";
import { Scene } from "../../hingler-party/client/ts/engine/object/scene/Scene";
import { SceneSwap } from "../../hingler-party/client/ts/engine/object/scene/SceneSwap";
import { MapSceneTest } from "../../test/mapscenetest";

class SwapObjectTest extends GameObject {
  private j: SceneSwap;

  constructor(ctx: GameContext) {
    super(ctx);
    this.j = ctx.loadNewScene(new MapSceneTest());
    addEventListener("keydown", async (e) => {
      console.log(this.j.getFractionLoaded());
      console.log(e);
      if (e.key === "e" && this.j.getFractionLoaded() > 0.999) {
        await this.j.swap();
      }
    });
  }
}

class MapSwapTest extends Scene {
  async initialize(ctx: GameContext) {
    let test = new SwapObjectTest(ctx);
    this.getGameObjectRoot().addChild(test);
  }
}

window.addEventListener("load", main);

let canvas : HTMLCanvasElement;
let engine : EngineContext;

function main() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  window.addEventListener("resize", resizeCanvas);
  // prevent right click, long press
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  });

  resizeCanvas();
  configureEngine();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function configureEngine() {
  engine = new EngineContext(canvas, new MapSwapTest());
  engine.deployContext();
}