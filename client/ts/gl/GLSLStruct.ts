/**
 * TS representation of a glsl struct.
 */
export interface GLSLStruct {
  /**
   * Binds this struct to a provided GLSL variable.
   * @param name - the name of the variable we are binding to.
   */
  bindToUniformByName(prog: WebGLProgram, name: string) : void;
}