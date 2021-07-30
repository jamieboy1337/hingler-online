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
 * Represents a 3D model.
 * TODO: Create a version of Model which acts like a GLTF model.
 * Probably wrap this class and not import -- draw will use GLTF material w params.
 */
export interface Model {
  /**
   * Binds an attribute to a specific location.
   * @param at - The attribute type we are binding.
   * @param location - the vertex index at which this attribute should be bound.
   *                   
   *                   In cases such as joints and weights where multiple attributes may be specified, these
   *                     can be provided via an array.
   */
  bindAttribute(at: AttributeType, ...location: Array<number>) : void;
  // separate bind out into its own interface
  // models exported thus far will use that interface
  // others will not :(

  // pbrmodel should support this workflow... but it should also contain a method
  // which just draws its pbr shit straight up and out

  /**
   * Dispatches draw calls for all geometry stored inside this model.
   */
  draw() : void;
}