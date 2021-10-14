import { mat4, ReadonlyMat4, vec2, vec4 } from "gl-matrix";
import { GameContext } from "../../engine/GameContext";
import { Framebuffer } from "../../engine/gl/Framebuffer";
import { ColorFramebuffer } from "../../engine/gl/internal/ColorFramebuffer";
import { ShaderProgramBuilder } from "../../engine/gl/ShaderProgramBuilder";
import { Texture } from "../../engine/gl/Texture";
import { Material } from "../../engine/material/Material";
import { PostProcessingFilter } from "../../engine/material/PostProcessingFilter";
import { AttributeType, Model } from "../../engine/model/Model";
import { GameModel } from "../../engine/object/game/GameModel";
import { GameObject } from "../../engine/object/game/GameObject";
import { RenderContext } from "../../engine/render/RenderContext";
import { RadialBlur } from "./RadialBlur";

const gradientCols : Array<vec4> = [
  [0.004985, 0.001524, 0.0, 1.0],
  [0.027342, 0.002434, 0.0, 1.0],
  [0.588432, 0.062403, 0.0, 1.0],
  [0.885711, 0.613466, 0.220887, 1.0]
];

const gradientStops : Array<number> = [
  0.0,
  0.440909,
  0.513637,
  0.818182
];

export class ExplosionFilter extends PostProcessingFilter implements Material {
  // draw the explosion to its own framebuffer
  // probably have a reference to it and just call its render function

  private explosionFramebuffer : Framebuffer;
  private explosionSwap : Framebuffer;
  private blur : RadialBlur;


  private glowShader : WebGLProgram;
  private posLoc : number;

  private colUnif : WebGLUniformLocation;
  private depthUnif : WebGLUniformLocation;
  private explosionUnif : WebGLUniformLocation;
  private blurDist : WebGLUniformLocation;
  private explosionZ : WebGLUniformLocation;

  private explosionColorShader : WebGLProgram;
  private posLocColor : number;

  private modelMatUnif   : WebGLUniformLocation;
  private vpMatUnif      : WebGLUniformLocation;
  private resolutionUnif : WebGLUniformLocation;
  private depthUnifCol   : WebGLUniformLocation;
  private glowCenter     : WebGLUniformLocation;

  private explosion: GameModel;
  private explosionCenter: GameObject;

  vpMat : ReadonlyMat4;
  tex : Texture;
  blurMag : number;

  // blur 8x8 = 64, run 3 times for effectively smooth steps in 24 texfetches

  constructor(ctx: GameContext, explosion: GameModel, explosionCenter: GameObject) {
    super(ctx);
    this.explosion = explosion;
    this.explosionCenter = explosionCenter;

    this.explosionFramebuffer = new ColorFramebuffer(ctx, ctx.getScreenDims());
    this.explosionSwap = new ColorFramebuffer(ctx, ctx.getScreenDims());
    this.blur = new RadialBlur(ctx);
    this.blurMag = 0.55;

    this.glowShader = null;
    this.explosionColorShader = null;
    // load model from res
    // either way we have to draw our explosion twice (?)
    // how about we implement the render func elsewhere and expose this one separately?
    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/explosionglow/explosionglow.vert")
      .withFragmentShader("../glsl/explosionglow/explosionglow.frag")
      .build()
      .then(this.bindUniformsGlow.bind(this));

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/termshock/termshock.vert")
      .withFragmentShader("../glsl/game/termshock/termshock.frag")
      .build()
      .then(this.bindUniformsColor.bind(this));
  }

  private bindUniformsGlow(prog: WebGLProgram) {
    this.glowShader = prog;

    let gl = this.getContext().getGLContext();
    this.posLoc = gl.getAttribLocation(prog, "aPosition");

    this.colUnif = gl.getUniformLocation(prog, "uColor");
    this.depthUnif = gl.getUniformLocation(prog, "uDepth");
    this.explosionUnif = gl.getUniformLocation(prog, "uExplosion");
    this.glowCenter = gl.getUniformLocation(prog, "glowCenter");
    this.blurDist = gl.getUniformLocation(prog, "dist");
  }

  private bindUniformsColor(prog: WebGLProgram) {
    this.explosionColorShader = prog;

    let gl = this.getContext().getGLContext();

    gl.useProgram(prog);

    for (let i = 0; i < 4; i++) {
      gl.uniform4fv(gl.getUniformLocation(this.explosionColorShader, "gradientCols[" + i + "]"), gradientCols[i]);
      gl.uniform1f(gl.getUniformLocation(this.explosionColorShader, "gradientStops[" + i + "]"), gradientStops[i]);
    }

    this.posLocColor = gl.getAttribLocation(prog, "aPosition");

    this.modelMatUnif = gl.getUniformLocation(prog, "model_matrix");
    this.vpMatUnif = gl.getUniformLocation(prog, "vp_matrix");
    this.resolutionUnif = gl.getUniformLocation(prog, "resolution");
    this.depthUnifCol = gl.getUniformLocation(prog, "uDepth");
    this.explosionZ = gl.getUniformLocation(prog, "explosionZ");
  }

  runFilter(src: Framebuffer, dst: Framebuffer, rc: RenderContext) {
    if (this.explosionColorShader !== null && this.glowShader !== null) {
      let gl = this.getContext().getGLContext();
      gl.disable(gl.CULL_FACE);
  
      let oldDims = this.explosionFramebuffer.dims;
      let newDims = this.getContext().getScreenDims();
      if (oldDims[0] !== newDims[0] || oldDims[1] !== newDims[1]) {
        this.explosionFramebuffer.setFramebufferSize(newDims);
        this.explosionSwap.setFramebufferSize(newDims);
      }
      
      gl.viewport(0, 0, newDims[0], newDims[1]);

      this.explosionFramebuffer.bindFramebuffer(gl.FRAMEBUFFER);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      // render our explosion object to the explosion framebuffer
      this.vpMat = rc.getActiveCameraInfo().vpMatrix;
      this.tex = src.getDepthTexture();
  
      // enable pos
      this.explosion.drawModel(rc, this);
      gl.disable(gl.BLEND);
      // use a model object to accomplish that
  
      // explosion fb now contains our explosion w depth acc'd for
      this.drawToFramebuffer(src, dst, rc);
    }
  }

  drawMaterial(model: Model) {
    let gl = this.getContext().getGLContext();
    gl.useProgram(this.explosionColorShader);

    gl.uniformMatrix4fv(this.modelMatUnif, false, this.explosion.getTransformationMatrix());
    gl.uniformMatrix4fv(this.vpMatUnif, false, this.vpMat);

    gl.uniform2fv(this.resolutionUnif, this.getContext().getScreenDims());
    // some weird shit when z is less than 0
    gl.uniform1f(this.explosionZ, this.explosion.getPosition()[0] + 50);
    this.tex.bindToUniform(this.depthUnifCol, 1);

    model.bindAttribute(AttributeType.POSITION, this.posLocColor);
    model.draw();
  }

  private drawToFramebuffer(src: Framebuffer, dst: Framebuffer, rc: RenderContext) {
    // bind explosion texture
    
    const EXPLOSION_SIZE = 0.55;
    let gl = this.getContext().getGLContext();
    
    let explosionCenterCoord = vec4.create();

    let explosionCenterPos = this.explosionCenter.getGlobalPosition();
    explosionCenterCoord = vec4.fromValues(explosionCenterPos[0], explosionCenterPos[1], explosionCenterPos[2], 1.0);
    vec4.transformMat4(explosionCenterCoord, explosionCenterCoord, this.vpMat);
    explosionCenterCoord = explosionCenterCoord.map((val) => ((val / explosionCenterCoord[3]) + 1) / 2) as [number, number, number, number];
    
    this.blur.center = [explosionCenterCoord[0], explosionCenterCoord[1]];
    this.blur.sampleCount = 8;
    this.blur.size = this.blurMag;
    
    this.blur.runFilter(this.explosionFramebuffer, this.explosionSwap, rc);
    
    this.blur.size = this.blurMag / 8;
    this.blur.runFilter(this.explosionSwap, this.explosionFramebuffer, rc);
    
    gl.useProgram(this.glowShader);
    dst.bindFramebuffer(gl.FRAMEBUFFER);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let buf = this.getScreenBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.posLoc);
    // bind fb texture

    src.getColorTexture().bindToUniform(this.colUnif, 1);
    src.getDepthTexture().bindToUniform(this.depthUnif, 2);
    this.explosionFramebuffer.getColorTexture().bindToUniform(this.explosionUnif, 3);

    
    // src to swap, swap to src, then run the rest
    
    gl.uniform2fv(this.glowCenter, explosionCenterCoord.slice(0, 2));
    gl.uniform1f(this.blurDist, this.blurMag / 64);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(this.posLoc);
  }
}