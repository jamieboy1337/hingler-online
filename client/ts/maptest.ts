import { EngineContext } from "../../hingler-party/client/ts/engine/internal/EngineContext";
import { MapSceneTest } from "../../test/mapscenetest";
import { SplashScreenScene } from "./game/splashscreen/SplashScreen";

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
  engine = new EngineContext(canvas, new MapSceneTest());
  engine.deployContext();
}
