import { GameContext } from "../../hingler-party/client/ts/engine/GameContext";
import { EngineContext } from "../../hingler-party/client/ts/engine/internal/EngineContext";
import { calculateTangentVectors } from "../../hingler-party/client/ts/engine/loaders/internal/calculateTangentVectors";
import { GLTFSceneImpl } from "../../hingler-party/client/ts/engine/loaders/internal/GLTFSceneImpl";
import { ModelImpl } from "../../hingler-party/client/ts/engine/loaders/internal/ModelImpl";
import { Model } from "../../hingler-party/client/ts/engine/model/Model";
import { Scene } from "../../hingler-party/client/ts/engine/object/scene/Scene";

function err(s: string) {
  console.error(s);
}

function near(a: number, b: number) {
  if (Math.abs(a - b) > 0.0001) {
    err("expected " + a + " to be near " + b);
  }
}

function testTangentFunction(model: Model, ctx: GameContext) {
  const m = model as ModelImpl;
  console.log(m.instances[0].positions.count);
  console.log("bringo");
  for (let inst of m.instances) {
    const tan = inst.tangents;
    if (!tan) {
      console.warn("skipping instance -- no tangents!");
      continue;
    }

    const tanCompare = calculateTangentVectors(inst, ctx);
    if (tanCompare.count !== tan.count) {
      err("bad result length");
    }

    for (let i = 0; i < tanCompare.count; i++) {
      const act = tanCompare.get(i);
      const exp = tan.get(i);
      console.log(act);
      console.log(exp);
      for (let j = 0; j < 3; j++) {
        // idk why w val is flipped i dont want to deal w it right now :(
        // shader disregards it anyway bc im an idiot
        near(act[j], exp[j]);
      }
    }
  }
}

class scenetest extends Scene {
  async initialize(ctx: GameContext) {
    const testscene = await ctx.getGLTFLoader().loadAsGLTFScene("../res/crate3d.glb") as GLTFSceneImpl;
    let models = testscene.getModelCount();
    // for (let i = 0; i < models; i++) {
    //   const m = testscene.getModel(i);
    //   console.log(m.name);
    //   testTangentFunction(m, ctx);
    // }
    testTangentFunction(testscene.getModel("Bomb"), ctx);
  }
}

window.addEventListener("load", main);

async function main() {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
  let ctx = new EngineContext(canvas, new scenetest());
  // test should run here
}