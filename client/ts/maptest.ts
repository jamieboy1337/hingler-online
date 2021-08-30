import { EngineContext } from "./engine/internal/EngineContext";
import { MapSceneTest } from "../../test/mapscenetest";

window.addEventListener("load", main);

let canvas : HTMLCanvasElement;
let engine : EngineContext;

function main() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  configureEngine();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function configureEngine() {
  engine = new EngineContext(canvas, new MapSceneTest());
  engine.step();
  requestAnimationFrame(stepEngine);
}

function stepEngine() {
  engine.drawFrame();
  engine.step();
  requestAnimationFrame(stepEngine);
}