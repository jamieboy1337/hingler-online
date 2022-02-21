import { GameObject } from "../../../../hingler-party/client/ts/engine/object/game/GameObject";

export const FIELD_WIDTH = 24;

// we specify tile swaps in num of field widths
/**
 * Manages resources pertaining to elements which appear on either side of the screen.
 */
export interface FieldManager {
  /**
   * @param x - the ordinality of the field element.
   * @returns a new GameObject which represents a field tile which should generate at the given x coordinate.
   */
  getFieldModel(n: number) : GameObject;

  /**
   * Sets the seed which determines which fields are returned for a given X coordinate.
   * @param n - the seed for this field.
   */
  setFieldSeed(n: number) : void;
}