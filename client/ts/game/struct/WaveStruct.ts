import { vec2 } from "gl-matrix";
import { GameContext } from "../../engine/GameContext";
import { GLSLStruct } from "../../engine/gl/GLSLStruct";
import { GLProgramWrap } from "../../engine/gl/internal/GLProgramWrap";

export class WaveStruct implements GLSLStruct {
  direction : vec2;
  steepness : number;
  amp       : number;
  freq      : number;
  speed     : number;

  private gl: WebGLRenderingContext;

  constructor(ctx: GameContext) {
    this.direction = vec2.create();
    // replace q with steepness, calculate here before sending to unif
    this.steepness = 0.5;
    this.amp = 1.0;
    this.freq = 1.0;
    this.speed = 1.0;

    this.gl = ctx.getGLContext();
  }

  bindToUniformByName(prog: GLProgramWrap, name: string) {
    const dirloc = prog.getUniformLocation(`${name}.direction`);
    const qaloc  = prog.getUniformLocation(`${name}.qa`); 
    const waloc  = prog.getUniformLocation(`${name}.wa`);
    const frqloc = prog.getUniformLocation(`${name}.freq`);
    const philoc = prog.getUniformLocation(`${name}.phi`);
    const amploc = prog.getUniformLocation(`${name}.amp`);

    const q = this.steepness / (this.freq * this.amp);

    const wa  = this.freq * this.amp;
    const qa  = q         * this.amp;
    const phi = this.freq * this.speed;

    const gl = this.gl;
    gl.uniform2f(dirloc, this.direction[0], this.direction[1]);
    gl.uniform1f(qaloc, qa);
    gl.uniform1f(waloc, wa);
    gl.uniform1f(frqloc, this.freq);
    gl.uniform1f(philoc, phi);
    gl.uniform1f(amploc, this.amp);
  }
}