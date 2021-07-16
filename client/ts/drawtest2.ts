import { vec3, vec4 } from "gl-matrix";
import { GameContext } from "./game/engine/GameContext";
import { EngineContext } from "./game/engine/internal/EngineContext";
import { Model } from "./game/engine/storage/Model";
import { MatteMaterial } from "./game/material/MatteMaterial";
import { GameCamera } from "./game/object/game/GameCamera";
import { GameModel } from "./game/object/game/GameModel";
import { RenderContext, RenderPass } from "./game/render/RenderContext";


window.addEventListener("load", main);

class DummyCamera extends GameCamera {
  time: number;
  constructor(ctx: GameContext) {
    super(ctx);
    this.time = 0;
  }

  update() {
    this.time += this.getContext().getDelta();
    this.setPosition(Math.sin(this.time * 6) * 4, 0, 15);
    this.fov = 45 + Math.sin(this.time * 11.44) * 10;
  }
}

class DummyModel extends GameModel {
  time: number;
  mat: MatteMaterial;
  constructor(ctx: GameContext, init: Model | string) {
    super(ctx, init);
    this.time = 0;
    this.mat = new MatteMaterial(ctx);
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;

    this.mat.light.position = new Float32Array([0.0, 4.0, 4.5, 1.0]);
    this.mat.light.intensity = 0.9;
    this.mat.light.ambient = new Float32Array([1, 1, 1, 1]);
    this.mat.light.diffuse = new Float32Array([1.0, 1.0, 1.0, 1.0]);
  }

  update() {
    this.time += this.getContext().getDelta();
    console.log(this.time);
    this.setRotationEuler(this.time * 360, 0, 0);
  }

  renderMaterial(rc: RenderContext) {
    this.mat.color[0] = 0;
    this.mat.color[1] = 0.8;
    this.mat.color[2] = 0.8;
    this.mat.color[3] = 1;
    let info = rc.getActiveCameraInfo();
    this.mat.vpMat = info.vpMatrix;
    this.mat.modelMat = this.getTransformationMatrix();
    this.drawModel(rc, this.mat);
  }
}

let ctx : EngineContext;
let model : DummyModel;
let cam : DummyCamera;

function main() {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = new EngineContext(canvas);
  model = new DummyModel(ctx, "../res/test.glb");
  cam = new DummyCamera(ctx);
  cam.fov = 45;
  cam.setPosition(0, 0, 15);

  requestAnimationFrame(thehingler);
}

function thehingler() {
  ctx.step();
  model.update();
  cam.update();
  
  let caminfo = cam.getCameraInfo();
  let rc : RenderContext = {
    getRenderPass() {
      return RenderPass.FINAL;
    },

    getActiveCameraInfo() {
      return caminfo;
    }
  };

  let gl = ctx.getGLContext();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  model.renderMaterial(rc);
  requestAnimationFrame(thehingler);
}