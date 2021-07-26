import { mat3, mat4 } from "gl-matrix";
import { EngineContext } from "../../client/ts/engine/internal/EngineContext";
import { FileLoader } from "../../client/ts/engine/loaders/FileLoader";
import { GLTFLoaderImpl } from "../../client/ts/engine/loaders/internal/GLTFLoaderImpl";
import { AttributeType, Model } from "../../client/ts/engine/storage/Model";
import { ShaderProgramBuilder } from "../../client/ts/engine/gl/ShaderProgramBuilder";

window.addEventListener("load", main);

let canvas : HTMLCanvasElement;
let gl : WebGLRenderingContext;
let prog : WebGLProgram;
let model : Model;


async function main() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  gl = canvas.getContext("webgl");
  gl = new Proxy(canvas.getContext("webgl"), {
    get: function(target, prop, receiver) {
      let res = target[prop];
      if (typeof res === "function") {
        let func = res as Function;
        return (...args: any) => {
          let res = func.apply(target, args);
          let err = target.getError();
          if (err !== target.NO_ERROR) {
            console.log("Err generated by last gl call to " + prop.toString() + ": " + err);
          }
          return res;
        }
      } else {
        return res;
      }
    }
  });
  
  let loader = new FileLoader();
  let modelLoader = new GLTFLoaderImpl(loader, gl);
  model = (await modelLoader.loadGLTFModel("../data/test.glb"))[0];
  let ctx = new EngineContext(canvas);
  // build shader, get program
  prog = await (new ShaderProgramBuilder(ctx).withVertexShader("../data/dummyshader.vert")
    .withFragmentShader("../data/dummyshader.frag")
    .build());

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  requestAnimationFrame(anim);
}

let i = 0;

function anim() {
  gl.useProgram(prog);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // create virtual camera
  let modelmat = mat4.create();
  mat4.identity(modelmat);
  mat4.translate(modelmat, modelmat, [0, 0, -5])
  mat4.rotate(modelmat, modelmat, i / 256, [0, .7070, .7070]);
  // grab 3x3 of model tx, inverse transform for normal matrix
  let normmat = mat3.create();
  mat3.fromMat4(normmat, modelmat);
  mat3.invert(normmat, normmat);
  mat3.transpose(normmat, normmat);
  // create a dummy camera matrix
  let cam = mat4.create();
  mat4.identity(cam);
  mat4.translate(cam, cam, [0, 0, 0]);
  i++;
  mat4.invert(cam, cam);
  let persp = mat4.create();
  mat4.perspective(persp, 1.607078 * 1.25, 1.333, 0.01, 1000);
  mat4.mul(cam, persp, cam);
  // apply it and hang out on it
  // we'll probably just use an identity and then we can use an identity for norm

  let posloc = gl.getAttribLocation(prog, "position");
  let normloc = gl.getAttribLocation(prog, "normal");
  
  // gl.enableVertexAttribArray(posloc);
  // gl.enableVertexAttribArray(normloc);

  model.bindAttribute(AttributeType.POSITION, posloc);
  model.bindAttribute(AttributeType.NORMAL, normloc);
  
  // set uniforms
  let modmatloc  = gl.getUniformLocation(prog, "model_matrix");
  let vpmatloc   = gl.getUniformLocation(prog, "vp_matrix");
  let normmatloc = gl.getUniformLocation(prog, "normal_matrix");

  gl.uniformMatrix4fv(modmatloc,  false, modelmat);
  gl.uniformMatrix4fv(vpmatloc,   false, cam);
  gl.uniformMatrix3fv(normmatloc, false, normmat);
  // get locations and bind

  model.draw();
  requestAnimationFrame(anim);
}