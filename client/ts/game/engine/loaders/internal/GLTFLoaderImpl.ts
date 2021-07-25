import { ArrayBufferToString } from "../../../../../../ts/util/StringToArrayBuffer";
import { GLAttribute } from "../../../../gl/GLAttribute";
import { GLAttributeImpl } from "../../../../gl/internal/GLAttributeImpl";
import { GLBuffer } from "../../../../gl/internal/GLBuffer";
import { GLBufferImpl } from "../../../../gl/internal/GLBufferImpl";
import { GLIndexImpl } from "../../../../gl/internal/GLIndexImpl";
import { Model } from "../../storage/Model";
import { FileLike } from "../FileLike";
import { FileLoader } from "../FileLoader";
import { GLTFLoader } from "../GLTFLoader";
import { GLTFScene } from "../GLTFScene";
import { GLTFSceneImpl } from "./GLTFSceneImpl";
import { Accessor, GLTFJson } from "./gltfTypes";
import { ModelImpl, ModelInstance } from "./ModelImpl";

const GLTF_MAGIC = 0x46546C67;
const CHUNK_TYPE_JSON = 0x4E4F534A;
const CHUNK_TYPE_BIN = 0x004E4942;

enum FileType {
  BINARY,
  UNKNOWN
};

export class GLTFLoaderImpl implements GLTFLoader {
  private loader: FileLoader;
  private gl: WebGLRenderingContext;

  constructor(loader: FileLoader, gl: WebGLRenderingContext) {
    this.loader = loader;
    this.gl = gl;
  }

  resolvePath(path: string) {
    let suffix = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
    switch (suffix) {
      case "glb":
        return FileType.BINARY;
      default:
        console.error("Cannot currently handle file " + path);
        return FileType.UNKNOWN;
    }
  }

  async loadAsGLTFScene(path: string) {
    let type = this.resolvePath(path);
    let res : GLTFScene;
    switch (type) {
      case FileType.BINARY:
        res = await this.glbBinaryToScene(path);
        break;
      case FileType.UNKNOWN:
        return null;
      default:
        console.error("Something went wrong :(");
        throw Error("what");
    }

    return res;
  }

  async loadGLTFModel(path: string) : Promise<Array<Model>> {
    // start out by just printing the stuff in the json field
    // as well as interpreting the binary data
    // convert to a resolvepath func
    let suffix = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
    let file = await this.loader.open(path);
    switch (suffix) {
      case "glb":
        return this.loadGLB(file);
      default:
        console.error("Cannot currently handle file " + path);
        return null;
    }
  }

  async glbBinaryToScene(path: string) : Promise<GLTFScene> {
    let file = await this.loader.open(path);
    let buf = file.asArrayBuffer();
    let view = new DataView(buf);

    // do everything up to reading the buffers, then return those
    // let the loading function handle parsing
    
    // read magic
    const magic = view.getUint32(0, true);
    if (magic !== GLTF_MAGIC) {
      let err = `Magic number in file does not match desired!`;
      console.warn(err);
      throw Error(err);
    }

    const ver = view.getUint32(4, true);
    if (ver !== 2) {
      let err = `Version number in file is not 2!`;
      console.warn(err);
      throw Error(err);
    }

    const len = view.getUint32(8, true);

    // first chunk is always json data, remaining are binary
    const jsonChunkLen = view.getUint32(12, true);
    const jsonChunkType = view.getUint32(16, true);
    if (jsonChunkType !== CHUNK_TYPE_JSON) {
      let err = `First chunk is not JSON!`;
      console.warn(err);
      throw Error(err);
    }

    let jsonData = buf.slice(20, 20 + jsonChunkLen);
    let jsonRaw = ArrayBufferToString(jsonData);
    console.debug(jsonRaw);
    let jsonParsed = JSON.parse(jsonRaw) as GLTFJson;

    console.log(jsonParsed);

    let buffers = this.readBinaryDataToBuffers(view, buf, 20 + jsonChunkLen, len);
    return new GLTFSceneImpl(this.gl, jsonParsed, buffers);
  }

  private async loadGLB(file: FileLike) : Promise<Array<Model>> {
    // TODO: load armatures alongside model data
    // for now, let's just get the model data into the scene
    // pass file arrbuf instead
    // there was some reason for it but i dont remember what
    let buf = file.asArrayBuffer();
    let view = new DataView(buf);

    // do everything up to reading the buffers, then return those
    // let the loading function handle parsing
    
    // read magic
    const magic = view.getUint32(0, true);
    if (magic !== GLTF_MAGIC) {
      let err = `Magic number in file does not match desired!`;
      console.warn(err);
      throw Error(err);
    }

    const ver = view.getUint32(4, true);
    if (ver !== 2) {
      let err = `Version number in file is not 2!`;
      console.warn(err);
      throw Error(err);
    }

    const len = view.getUint32(8, true);

    // first chunk is always json data, remaining are binary
    const jsonChunkLen = view.getUint32(12, true);
    const jsonChunkType = view.getUint32(16, true);
    if (jsonChunkType !== CHUNK_TYPE_JSON) {
      let err = `First chunk is not JSON!`;
      console.warn(err);
      throw Error(err);
    }

    let jsonData = buf.slice(20, 20 + jsonChunkLen);
    let jsonRaw = ArrayBufferToString(jsonData);
    console.debug(jsonRaw);
    let jsonParsed = JSON.parse(jsonRaw) as GLTFJson;

    console.log(jsonParsed);

    let buffers = this.readBinaryDataToBuffers(view, buf, 20 + jsonChunkLen, len);
    let models : Array<Model> = [];

    // create GLAttribute for each accessor
    
    for (let mesh of jsonParsed.meshes) {
      
      // hash by contents, share attributes between models
      const instances : Array<ModelInstance> = [];
      
      for (let prim of mesh.primitives) {
        // tba: come up with a more efficient method to avoid redundant attributes
        const inst = {} as ModelInstance;
        inst.positions      = this.createAttributeFromJSON(jsonParsed, buffers, prim.attributes.POSITION);
        inst.normals        = this.createAttributeFromJSON(jsonParsed, buffers, prim.attributes.NORMAL);
        inst.texcoords      = this.createAttributeFromJSON(jsonParsed, buffers, prim.attributes.TEXCOORD_0);

        let joint = this.createAttributeFromJSON(jsonParsed, buffers, prim.attributes.JOINTS_0);
        if (joint) {
          inst.joints = [joint];
        }

        let weight = this.createAttributeFromJSON(jsonParsed, buffers, prim.attributes.WEIGHTS_0);
        if (weight) {
          inst.weights = [weight];
        }

        {
          // indices
          let indexAccessor = jsonParsed.accessors[prim.indices];
          let indexView = jsonParsed.bufferViews[indexAccessor.bufferView];
          let buffer = buffers[indexView.buffer];
          // copy buffer to indexBuffer
          // we reuse the arrbuf object, so there's no needless duplication of data
          // we just give it a fresh start as an element array
          let indexBuffer = buffer.copy();

          inst.indices = new GLIndexImpl(indexBuffer, indexAccessor, indexView);
        }

        instances.push(inst);
      }

      let model = new ModelImpl(instances);
      models.push(model);
    }

    return models;
  }

  // returns null if the accessor is falsy (undefined, null, etc)
  private createAttributeFromJSON(data: GLTFJson, buffers: Array<GLBuffer>, accessor: number) {
    if (accessor === undefined) {
      return null;
    }

    let ac = data.accessors[accessor];
    let view = data.bufferViews[ac.bufferView];
    let buffer = buffers[view.buffer];
    return new GLAttributeImpl(buffer, view, ac);
  }

  private readBinaryDataToBuffers(view: DataView, buffer: ArrayBuffer, initOffset: number, len: number) : Array<GLBuffer> {
    let buffers : Array<GLBuffer> = [];
    let chunkCount = 1;
    let offset = initOffset;
    while (offset < len) {
      let chunkLen = view.getUint32(offset, true);
      offset += 4;

      let chunkType = view.getUint32(offset, true);
      offset += 4;
      if (chunkType !== CHUNK_TYPE_BIN) {
        let err = `Chunk ${chunkCount} did not contain binary data!`;
        console.warn(err);
        throw Error(err);
      }

      buffers.push(new GLBufferImpl(this.gl, buffer.slice(offset, chunkLen + offset)))
      offset += chunkLen;
    }

    return buffers;
  }
}