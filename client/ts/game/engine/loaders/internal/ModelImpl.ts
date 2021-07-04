import { GLAttribute } from "../../../../gl/GLAttribute";
import { GLIndex } from "../../../../gl/GLIndex";
import { GLAttributeImpl } from "../../../../gl/internal/GLAttributeImpl";
import { GLIndexImpl } from "../../../../gl/internal/GLIndexImpl";
import { AttributeType, Model, Triangle, Vertex } from "../../storage/Model";

// todo: reclassify as primitive -- point=1, line=2, tri=3
class TriangleIterator implements Iterator<Triangle> {
  model: ModelImpl;
  offset: number;
  instance: number;

  constructor(model: ModelImpl) {
    this.model = model;
    this.offset = 0;
    this.instance = 0;
  }
  next() {
    // if we are not at the end of the index list: return the next index
    // otherwise, go to the next instance
    if (this.instance >= this.model.instances.length) {
      return {value: null, done: true};
    }

    if (this.offset >= this.model.instances[this.instance].indices.count) {
      this.instance++;
      this.offset = 0;

      // :(
      if (this.instance >= this.model.instances.length) {
        return {value: null, done: true};
      }
    }

    let verts = [];
    let inst = this.model.instances[this.instance];

    // assuming tris
    for (let i = 0; i < 3; i++) {
      let ind = inst.indices.getIndex(this.offset++);

      let pos = (inst.positions ? inst.positions.get(ind) : null);
      let norm = (inst.normals ? inst.normals.get(ind) : null);
      let tex = (inst.texcoords ? inst.texcoords.get(ind) : null);
      let joint = (inst.joints ? [] : null);
      let weight = (inst.weights ? [] : null);

      if (inst.joints) {
        for (let j = 0; j < inst.joints.length; j++) {
          joint.push(inst.joints[j].get(ind));
        }
      }

      if (inst.weights) {
        for (let j = 0; j < inst.weights.length; j++) {
          weight.push(inst.weights[j].get(ind));
        }
      }

      let vert : Vertex = {
        position: pos,
        normal: norm,
        texcoord: tex,
        joints: joint,
        weights: weight
      };

      verts.push(vert);
    }

    // all good
    let res = {
      vertices: verts
    };

    return {value: res, done: ((this.instance === this.model.instances.length - 1) && this.offset >= this.model.instances[this.instance].indices.count)};
  }
}

/**
 * Represents a single instance which may comprise a model.
 */
export interface ModelInstance {
  positions: GLAttribute;
  normals?: GLAttribute;
  texcoords?: GLAttribute;
  joints?: Array<GLAttribute>;
  weights?: Array<GLAttribute>;
  indices: GLIndex;
}

export class ModelImpl implements Model {
  readonly instances: Array<ModelInstance>;

  posLocation: number;
  normLocation: number;
  texLocation: number;
  jointLocation: Array<number>;
  weightLocation: Array<number>;
  
  constructor(instances: Array<ModelInstance>) {
    this.instances = instances;
    this.posLocation = 0;
    this.normLocation = 0;
    this.texLocation = 0;
    this.jointLocation = [];
    this.weightLocation = [];
  }

  [Symbol.iterator]() : Iterator<Triangle> {
    return new TriangleIterator(this);
  }

  bindAttribute(at: AttributeType, ...location: Array<number>) {
    switch (at) {
      case AttributeType.POSITION:
        this.posLocation = location[0];
        break;
      case AttributeType.NORMAL:
        this.normLocation = location[0];
        break;
      case AttributeType.TEXCOORD:
        this.texLocation = location[0];
        break;
      case AttributeType.JOINT:
        this.jointLocation = location;
        break;
      case AttributeType.WEIGHT:
        this.weightLocation = location;
        break;
      default:
        console.warn("noop: bindattribute received unhandled attribute type");
    }
  }

  draw() {
    for (let inst of this.instances) {
      if (this.posLocation) {
        inst.positions.pointToAttribute(this.posLocation);
      } else {
        console.warn("position not bound :)");
      }

      if (inst.normals && this.normLocation) {
        inst.normals.pointToAttribute(this.normLocation);
      }

      if (inst.texcoords && this.texLocation) {
        inst.texcoords.pointToAttribute(this.texLocation);
      }

      for (let i = 0; inst.joints && this.jointLocation && i < this.jointLocation.length && i < inst.joints.length; i++) {
        inst.joints[i].pointToAttribute(this.jointLocation[i]);
      }

      for (let i = 0; inst.weights && this.weightLocation && i < this.weightLocation.length && i < inst.weights.length; i++) {
        inst.weights[i].pointToAttribute(this.weightLocation[i]);
      }

      inst.indices.draw();
    }
  }
}