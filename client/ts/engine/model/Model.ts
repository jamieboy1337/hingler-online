import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { GLAttribute } from "../gl/GLAttribute";

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
  WEIGHT,
  TANGENT
}

/**
 * Model which does not enable binding of attributes. Draw only.
 */
export interface DrawOnlyModel {
  draw() : void;
}

/**
 * Represents a 3D model.
 * TODO: Create a version of Model which acts like a GLTF model.
 * Probably wrap this class and not import -- draw will use GLTF material w params.
 */
export interface Model extends DrawOnlyModel {
  /**
   * Binds an attribute to a specific location.
   * @param at - The attribute type we are binding.
   * @param location - the vertex index at which this attribute should be bound.
   *                   
   *                   In cases such as joints and weights where multiple attributes may be specified, these
   *                     can be provided via an array.
   */
  bindAttribute(at: AttributeType, ...location: Array<number>) : void;
}