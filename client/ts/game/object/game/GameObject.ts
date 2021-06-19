import { GameContext } from "../../engine/GameContext";
import { EngineObject } from "../EngineObject";

import { mat4, vec3, quat } from "gl-matrix";
import { RenderContext } from "../../render/RenderContext";

/**
 * Game object rendered to a lovely 3d world.
 */
export abstract class GameObject extends EngineObject {
  private children: Set<GameObject>;
  private parent: GameObject;

  private transform_cache: mat4;
  private position: vec3;
  private scale: vec3;
  private rotation: quat;

  private dirty: boolean;

  constructor(ctx: GameContext) {
    super(ctx);
    this.children = new Set();
    this.parent = null;

    this.transform_cache = mat4.create();
    mat4.identity(this.transform_cache);

    this.position = vec3.create();
    vec3.zero(this.position);

    this.scale = vec3.create();
    vec3.zero(this.scale);

    this.rotation = quat.create();
    quat.identity(this.rotation);
    this.dirty = false;
  }

  /**
   * Function which draws this component onto the screen.
   * Should be called once whenever this object is drawn.
   */
  abstract renderMaterial(rc: RenderContext) : void;

  getChildren() : Array<GameObject> {
    let res = [] as GameObject[];
    for (let child of this.children) {
      res.push(child);
    }

    return res;
  }

  getChild(id: number) {
    for (let child of this.children) {
      if (child.getId() === id) {
        return child;
      }
    }

    let res : GameObject;

    for (let child of this.children) {
      res = child.getChild(id);
      if (res) {
        return res;
      }
    }

    return null;
  }

  /**
   * Removes the object with passed ID from this object's hierarchy.
   * @param id - the ID of the object we wish to find.
   * @returns the object if it could be found and removed -- otherwise, null.
   */
  removeChild(id: number) {
    if (id === this.getId()) {
      return null;
    }

    let res : GameObject = null;
    for (let child of this.children) {
      if (child.getId() === id) {
        res = child;
        break;
      }
    }

    if (res !== null) {
      this.children.delete(res);
      res.parent = null;
      res.invalidateTransformCache_();
      return res;
    }

    // desired child is not a direct descendant.

    res = this.getChild(id);
    if (res) {
      res.parent.removeChild(res.getId());
      res.parent = null;
      res.invalidateTransformCache_();
      return res;
    }
  }

  /**
   * Adds the passed view as a child of this view.
   * @param elem - the new child.
   * @returns true if the view could be successfully added as a child -- false otherwise.
   */
  addChild(elem: GameObject) {
    // if this is anywhere above me in the hierarchy, we'll have a problem
    if (elem.getChild(this.getId())) {
      console.warn("An element's descendant cannot also be its parent!");
      return false;
    } else {
      if (elem.parent) {
        elem.parent.removeChild(elem.getId());
      }

      elem.invalidateTransformCache_();
      elem.parent = this;
      this.children.add(elem);
      return true;
    }
  }

  /**
   * @returns Rotation of this gameobject.
   */
  getRotation() {
    return quat.copy(quat.create(), this.rotation);
  }

  /**
   * @returns Position of this gameobject.
   */
  getPosition() {
    return vec3.copy(vec3.create(), this.position);
  }

  /**
   * @returns Scale of this gameobject.
   */
  getScale() {
    return vec3.copy(vec3.create(), this.scale);
  }

  /**
   * Sets the rotation of this GameObject in euler coordinates.
   * @param x - x rotation, or vec3 containing XYZ euler rotation.
   * @param y - if valid: y rotation.
   * @param z - if valid: z rotation.
   */
  setRotationEuler(x: number | vec3, y?: number, z?: number) {
    if (x.constructor === vec3.constructor) {
      this.setRotationEulerNum_(x[0], x[1], x[2]);
    } else if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
      this.setRotationEulerNum_(x, y, z);
    }
  }

  private setRotationEulerNum_(x: number, y: number, z: number) {
    quat.fromEuler(this.rotation, x, y, z);

    this.invalidateTransformCache_();
  }

  /**
   * Sets the scale of this GameObject.
   * @param x - either the x dimension or our scale, or a vec3 containing the new scale for this object.
   * @param y - if valid: y scale.
   * @param z - if valid: z scale.
   */
  setScale(x: number | vec3, y?: number, z?: number) {
    if (x.constructor === vec3.constructor) {
      this.setScaleNum_(x[0], x[1], x[2]);
    } else if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
      this.setScaleNum_(x, y, z);
    } else {
      console.warn("Parameters to `setScale` cannot be interpreted.")
    }
  }

  private setScaleNum_(x: number, y: number, z: number) {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;

    this.invalidateTransformCache_();
  }

  /**
   * Sets the position of this GameObject.
   * @param x - x coordinate, or vector containing new pos.
   * @param y - y coordinate, if valid.
   * @param z - z coordinate, if valid. 
   */
  setPosition(x: number | vec3, y?: number, z?: number) {
  if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
    this.setPositionNum_(x, y, z);
  // this is the best i can do i think
  } else if (x instanceof Float32Array) {
      this.setPositionNum_(x[0], x[1], x[2]);
  } else {
      console.warn("Parameters to `setPosition` cannot be interpreted.")
    }
  }

  private setPositionNum_(x: number, y: number, z: number) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;

    this.invalidateTransformCache_();
  }

  private invalidateTransformCache_() {
    this.dirty = true;
    for (let child of this.children) {
      child.invalidateTransformCache_();
    }
  }

  /**
   * @returns the transformation matrix associated with this GameObject.
   */
  getTransformationMatrix() {
    if (this.dirty) {
      let res = mat4.create();
      mat4.identity(res);
  
      let rot = mat4.create();
      mat4.fromQuat(rot, this.rotation)
      
      res = mat4.translate(res, res, this.position);
      res = mat4.mul(res, res, rot);
      res = mat4.scale(res, res, this.scale);
      
      if (this.parent !== null) {
        mat4.mul(res, this.parent.getTransformationMatrix(), res);
      }

      this.transform_cache = res;
      this.dirty = false;
    }

    return mat4.copy(mat4.create(), this.transform_cache);
  }
}