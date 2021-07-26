import { GLAttributeImpl } from "../../gl/internal/GLAttributeImpl";
import { GLBuffer } from "../../gl/internal/GLBuffer";
import { GLIndexImpl } from "../../gl/internal/GLIndexImpl";
import { GLTFTexture } from "../../gl/internal/GLTFTexture";
import { Texture } from "../../gl/Texture";
import { Model } from "../../storage/Model";
import { GLTFScene } from "../GLTFScene";
import { GLTFJson, ImageSchema, Mesh, TextureSchema } from "./gltfTypes";
import { ModelImpl, ModelInstance } from "./ModelImpl";

export class GLTFSceneImpl implements GLTFScene {
  gl     : WebGLRenderingContext;
  buffers: Array<GLBuffer>;
  data   : GLTFJson;

  constructor(gl: WebGLRenderingContext, data: GLTFJson, buffers: Array<GLBuffer>) {
    this.gl = gl;
    this.data = data;
    this.buffers = buffers;
  }

  // TODO: add function which fetches a pbr model
  // the pbr model obscures all binding locations bc it always uses the same shader(s).
  // I'm not up to speed on how the pbr shader is written but i think i can do it within a short span of time

  // this should not be the priority, though!
  // our priority should be ensuring that our engine is usable.

  getModel(name: string) : Model {
    for (let mesh of this.data.meshes) {
      if (mesh.name === name) {
        return this.meshToModel(mesh);
      }
    }
    return null;
  }

  getTexture(name: string) : Texture {
    if (this.data.textures) {
      for (let tex of this.data.textures) {
        let img = this.data.images[tex.source];
        if (img.name === name) {
          // TODO: alternative methods of fetching textures (name not always present)
          return this.texSchemaToTexture(tex, img);
        } 
      }
    }

    return null;
  }
  
  private texSchemaToTexture(texture: TextureSchema, img: ImageSchema) : Texture {
    if (!img.bufferView) {
      let err = "Loader does not currently handle image URIs.";
      console.error(err);
      throw Error(err);
    }

    let view = this.data.bufferViews[img.bufferView];
    if (!view) {
      let err = "Invalid GLTF file: view specified by image schema does not exist";
      console.error(err);
      throw Error(err);
    }

    let buffer = this.buffers[view.buffer];

    if (!buffer) {
      let err = "Buffer returned undefined while attempting to create a texture from it";
      console.error(err);
      throw Error(err);
    }
    let sampler = this.data.samplers[texture.sampler];
    if (!sampler) {
      let err = "Invalid GLTF file: sampler specified by texture schema does not exist";
      console.error(err);
      throw Error(err);
    }

    // we ultimately need the arraybuffer to gen an image
    // delegating that responsibility to the glbuffer is not to our benefit
    // the glbuffer replaces our "GL BUFFERS" (yeah everything is but whatever)
       let arrbuf = buffer.arrayBuffer();
    let off = view.byteOffset ? view.byteOffset : 0;
    let imgbuf = arrbuf.slice(off, view.byteLength + off);
    return new GLTFTexture(this.gl, imgbuf, sampler, img.mimeType);
  }

  private meshToModel(mesh: Mesh) : Model {
    const instances : Array<ModelInstance> = [];
    for (let prim of mesh.primitives) {
      // tba: come up with a more efficient method to avoid redundant attributes
      const inst = {} as ModelInstance;
      inst.positions      = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.POSITION);
      inst.normals        = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.NORMAL);
      inst.texcoords      = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.TEXCOORD_0);

      let joint = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.JOINTS_0);
      if (joint) {
        inst.joints = [joint];
      }

      let weight = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.WEIGHTS_0);
      if (weight) {
        inst.weights = [weight];
      }

      {
        // indices
        let indexAccessor = this.data.accessors[prim.indices];
        let indexView = this.data.bufferViews[indexAccessor.bufferView];
        let buffer = this.buffers[indexView.buffer];
        // copy buffer to indexBuffer
        // we reuse the arrbuf object, so there's no needless duplication of data
        // we just give it a fresh start as an element array
        let indexBuffer = buffer.copy();

        inst.indices = new GLIndexImpl(indexBuffer, indexAccessor, indexView);
      }

      instances.push(inst);
    }

    return new ModelImpl(instances); 
  }

  private createAttributeFromJSON(data: GLTFJson, buffers: Array<GLBuffer>, accessor: number) {
    if (accessor === undefined) {
      return null;
    }

    let ac = data.accessors[accessor];
    let view = data.bufferViews[ac.bufferView];
    let buffer = buffers[view.buffer];
    return new GLAttributeImpl(buffer, view, ac);
  }
}