import { GameContext } from "../../game/engine/GameContext";
import { AttenuatingLight } from "../../game/object/game/light/AttenuatingLight";
import { GLSLStruct } from "../GLSLStruct";

export class AttenuationStruct implements GLSLStruct {
  readonly atten_const: number;
  readonly atten_linear: number;
  readonly atten_quad: number;
  
  private gl: WebGLRenderingContext;
  constructor(ctx: GameContext, light: AttenuatingLight) {
    this.atten_const = light.atten_const;
    this.atten_linear = light.atten_linear;
    this.atten_quad = light.atten_quad;

    this.gl = ctx.getGLContext();
  }

  bindToUniformByName(prog: WebGLProgram, name: string) {
    let gl = this.gl;
    const constLoc = gl.getUniformLocation(prog, name + ".atten_const");
    const linearLoc = gl.getUniformLocation(prog, name + ".atten_linear");
    const quadLoc = gl.getUniformLocation(prog, name + ".atten_quad");

    gl.uniform1f(constLoc, this.atten_const);
    gl.uniform1f(linearLoc, this.atten_linear);
    gl.uniform1f(quadLoc, this.atten_quad);
  }
}