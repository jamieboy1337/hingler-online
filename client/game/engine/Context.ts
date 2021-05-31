/**
 * A Context aims to provide consistent information to all components on the state of execution.
 */
export interface GameContext {
  /**
   * @returns the delta on the last frame, in seconds.
   */
  getDelta() : number;
}