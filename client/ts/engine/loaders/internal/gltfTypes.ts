export interface Accessor {
  bufferView: number,
  byteOffset?: number,
  normalized?: boolean,
  componentType: number,
  count: number,
  min: Array<number>,
  max: Array<number>,
  type: string
};

export interface BufferView {
  buffer: number,
  byteLength: number,
  byteOffset?: number,
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
  indices: number,
  material: number,
  attributes: {
    POSITION: number,
    NORMAL?: number,
    TANGENT?: number,
    TEXCOORD_0?: number,
    TEXCOORD_1?: number,
    COLOR_0?: number,
    JOINTS_0?: number,
    WEIGHTS_0?: number
  }
}

export interface Mesh {
  name: string,
  primitives: Array<Primitive>
}

// TODO: handling defaults?
export interface Sampler {
  magFilter?: number,
  minFilter?: number,
  wrapS?: number,
  wrapT?: number,
  name?: string
};

export interface ImageSchema {
  mimeType?: string;
  bufferView?: number;
  name: string;
}

export interface TextureSchema {
  sampler: number,
  source: number
};

export interface TextureInfoSchema {
  index: number;
}

export interface PBRMaterialSchema {
  baseColorFactor?: [number, number, number, number],
  baseColorTexture?: TextureInfoSchema,
  metallicFactor?: number,
  roughnessFactor?: number,
  metallicRoughnessTexture?: TextureInfoSchema
};

export interface MatNormalTexture {
  index: number,
  // ignore this for now
  texcoord: number,
  scale: number
}

export interface Material {
  name?: string,
  pbrMetallicRoughness: PBRMaterialSchema,
  normalTexture?: MatNormalTexture
};

// handle optional params
export interface GLTFJson {
  accessors?: Array<Accessor>,
  buffers?: Array<Buffer>,
  bufferViews?: Array<BufferView>,
  images?: Array<ImageSchema>,
  materials?: Array<Material>,
  meshes?: Array<Mesh>,
  nodes?: Array<Node>,
  samplers?: Array<Sampler>,
  textures?: Array<TextureSchema>
};