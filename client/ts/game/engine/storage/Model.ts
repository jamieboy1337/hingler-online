import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { GLAttribute } from "../../../gl/GLAttribute";

// triangle will bundle our attribs up into something like this
export interface Vertex {
  readonly position: Float32Array;
  readonly normal?: Float32Array;
  readonly texcoord?: Float32Array;
  readonly joints?: Array<Float32Array>;
  readonly weights?: Array<Float32Array>;
}

export interface Triangle {
  readonly vertices: Array<Vertex>;
}

export enum AttributeType {
  POSITION,
  NORMAL,
  TEXCOORD,
  JOINT,
  WEIGHT
}

/**
 * Represents a 3D model.
 */
export interface Model {
  [Symbol.iterator]() : Iterator<Triangle>;

  /**
   * Binds an attribute to a specific location.
   * @param at - The attribute type we are binding.
   * @param location - the vertex index at which this attribute should be bound.
   *                   
   *                   In cases such as joints and weights where multiple attributes may be specified, these
   *                     can be provided via an array.
   */
  bindAttribute(at: AttributeType, ...location: Array<number>) : void;

  /**
   * Dispatches draw calls for all geometry stored inside this model.
   */
  draw() : void;
}