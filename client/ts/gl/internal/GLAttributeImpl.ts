import { Accessor, BufferView } from "../../game/engine/loaders/internal/gltfTypes";
import { GLAttribute } from "../GLAttribute";
import { BufferTarget, DataType, GLBuffer } from "./GLBuffer";

// type informs what information we're returning
// we'll cast to the proper return type when we create one

interface AttributeIterator<U> extends Iterator<U> {
  readFunc: (offset: number, littleEndian?: boolean) => number,
  buffer: GLBuffer,
  offset: number,
  stride: number,
  elem: number,
  comps: number,
  count: number,
  componentSize: number
}

// TODO:
// return float32arrays from everything
// attributes are context dependent, but we can return them
// we can already bind everything, but getting the component count wrong by chance will suck
// so let's let the implementor figure it out :3

// internal implementation of glattribute.
// engine specifies fields before casting to proper attr format and returning
export class GLAttributeImpl implements GLAttribute {
  buffer: GLBuffer;
  readonly comps: number;
  readonly type: number;
  readonly offset: number;
  readonly stride: number;
  readonly count: number;

  readonly componentByteSize: number;

  private accessFunc: (offset: number, littleEndian?: boolean) => number;
  
  constructor(buffer: GLBuffer, view: BufferView, accessor: Accessor) {
    this.buffer = buffer;
    switch (accessor.type) {
      case "SCALAR":
        this.comps = 1;
        break;
      case "VEC2":
      case "VEC3":
      case "VEC4":
        this.comps = Number.parseInt(accessor.type.charAt(3), 10);
        break;
      default:
        let err = `Unknown accessor type: ${accessor.type}`;
        console.warn(err);
        throw Error(err);
    }

    this.type = accessor.componentType;
    this.offset = view.byteOffset + (accessor.byteOffset !== undefined ? accessor.byteOffset : 0);
    this.stride = (view.byteStride !== undefined ? view.byteStride : 0);

    switch (this.type) {
      case DataType.BYTE:
      case DataType.UNSIGNED_BYTE:
        this.componentByteSize = 1;
        break;
      case DataType.SHORT:
      case DataType.UNSIGNED_SHORT:
        this.componentByteSize = 2;
        break;
      case DataType.FLOAT:
        this.componentByteSize = 4;
        break;
      default:
        let err = `Unknown component type: ${this.type}`;
        console.warn(err);
        throw Error(err);

    }

    switch (this.type) {
      case DataType.BYTE:
        this.accessFunc = this.buffer.getInt8.bind(buffer);
        break;
      case DataType.UNSIGNED_BYTE:
        this.accessFunc = this.buffer.getUint8.bind(buffer);
        break;
      case DataType.SHORT:
        this.accessFunc = this.buffer.getInt16.bind(buffer);
        break;
      case DataType.UNSIGNED_SHORT:
        this.accessFunc = this.buffer.getUint16.bind(buffer);
        break;
      case DataType.FLOAT:
        this.accessFunc = this.buffer.getFloat32.bind(buffer);
        break;
    }

    this.count = accessor.count;

    console.log("start point: " + this.offset + ", elems: " + this.count + ", stride: " + this.stride + ", width: " + this.componentByteSize);
  }

  pointToAttribute(location: number) {
    this.buffer.bindToVertexAttribute(location, this.comps, this.type, false, this.stride, this.offset);
  }

  // probably just return number instead of float32array?
  // mantissa is 23bit so we won't lose any info this way
  // ... i probably wont use int attribs because they don't interp and i dont need them >:)
  [Symbol.iterator]() : Iterator<Float32Array> {
    let accessFunc : (offset: number, littleEndian?: boolean) => number = this.accessFunc;

    const iterator : AttributeIterator<Float32Array> = {
      buffer: this.buffer,
      readFunc: accessFunc,
      offset: this.offset,
      stride: this.stride,
      elem: 0,
      comps: this.comps,
      componentSize: this.componentByteSize,
      count: this.count,
      
      next: function() {
        if (this.elem >= this.count) {
          return {done: true, value: null};
        }
        let pos = (this.elem * (this.stride !== 0 ? this.stride : this.componentSize * this.comps)) + this.offset;
        let res : any;
        res = new Float32Array(this.comps);
        for (let i = 0; i < this.comps; i++) {
          // read from wrapper function
          res[i] = this.readFunc(pos + i * this.componentSize, true);
        }

        this.elem++;
        return {done: (this.elem >= this.count), value: res};
      }
    }

    return iterator;
  }

  get(index: number) : Float32Array {
    let pos = index * (this.stride !== 0 ? this.stride : this.componentByteSize * this.comps) + this.offset;
    let res = new Float32Array(this.comps);
    for (let i = 0; i < this.comps; i++) {
      res[i] = this.accessFunc(pos, true);
      pos += this.componentByteSize;
    }

    return res;
  }


}