export interface Accessor {
  bufferView: number,
  byteOffset: number,
  componentType: number,
  count: number,
  min: Array<number>,
  max: Array<number>,
  type: string
};

export interface BufferView {
  buffer: number,
  byteLength: number,
  byteOffset: number,
  byteStride?: number
};

export interface Buffer {
  byteLength: number
}

export interface Node {
  name: string,
  rotation?: [number, number, number, number],
  translation?: [number, number, number],
  scale?: [number, number, number],
  mesh?: number,
  skin?: number
}

export interface Primitive {
  attributes: any,
  indices: number,
  material: number
}

export interface Mesh {
  name: string,
  primitives: Array<Primitive>
}

export interface GLTFJson {
  accessors: Array<Accessor>,
  bufferViews: Array<BufferView>,
  buffers: Array<Buffer>,
  meshes: Array<Mesh>,
  nodes: Array<Node>
};