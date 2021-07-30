import { vec2, vec3 } from "gl-matrix";
import { GameContext } from "../../GameContext";
import { GLAttribute } from "../../gl/GLAttribute";
import { GLAttributeImpl } from "../../gl/internal/GLAttributeImpl";
import { GLBuffer } from "../../gl/internal/GLBuffer";
import { GLBufferImpl } from "../../gl/internal/GLBufferImpl";
import { GLIndexImpl } from "../../gl/internal/GLIndexImpl";
import { GLTFTexture } from "../../gl/internal/GLTFTexture";
import { Texture } from "../../gl/Texture";
import { PBRMaterial } from "../../material/PBRMaterial";
import { Model } from "../../storage/Model";
import { GLTFScene } from "../GLTFScene";
import { GLTFJson, ImageSchema, Mesh, Primitive, TextureSchema } from "./gltfTypes";
import { ModelImpl, ModelInstance } from "./ModelImpl";
import { PBRModelImpl } from "./PBRModelImpl";

export class GLTFSceneImpl implements GLTFScene {
  ctx    : GameContext;
  gl     : WebGLRenderingContext;
  buffers: Array<GLBuffer>;
  data   : GLTFJson;

  constructor(ctx: GameContext, data: GLTFJson, buffers: Array<GLBuffer>) {
    this.ctx = ctx;
    this.gl = ctx.getGLContext();
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

  getTexture(name: string | number) : Texture {
    if (typeof name === "string") {
      return this.getTextureFromName(name);
    } else {
      return this.getTextureFromNumber(name);
    }
  }

  private getTextureFromName(name: string) {
    if (this.data.textures) {
      for (let tex of this.data.textures) {
        let img = this.data.images[tex.source];
        if (img.name === name) {
          // TODO: alternative methods of fetching textures (name not always present)
          return this.texSchemaToTexture(tex, img);
        } 
      }
    }
  }

  private getTextureFromNumber(ind: number) {
    if (this.data.textures && ind < this.data.textures.length) {
      let tex = this.data.textures[ind];
      return this.texSchemaToTexture(tex, this.data.images[tex.source]);
    }
  }

  getPBRModel(model: string | number) {
    // get model name or number as mesh
    let meshID: number = -1;
    if (typeof model === "number") {
      meshID = model;
    } else {
      for (let i = 0; i < this.data.meshes.length; i++) {
        if (this.data.meshes[i].name === model) {
          meshID = i;
          break;
        }
      }
    }

    if (meshID < 0 || meshID >= this.data.meshes.length) {
      let err = "Invalid mesh identifier provided.";
      console.error(err);
      throw err;
    }

    let mesh = this.data.meshes[meshID];
    let models : Array<Model> = [];
    let materials : Array<PBRMaterial> = [];
    for (let prim of mesh.primitives) {
      let inst = this.getInstance(prim);
      // if (!inst.tangents) {
      //   let tans = this.calculateTangentVectors(inst);
      //   inst.tangents = tans;
      // }
      
      let model = new ModelImpl([inst]);
      // get material for primitive
      let mat = this.data.materials[prim.material];
      if (!mat) {
        const err = "Could not find relevant material";
        console.error(err);
        throw Error(err);
      }
      // create a PBRMaterial which mirrors that material
      // append it to an array

      let pbrMat = new PBRMaterial(this.ctx);

      if (mat.normalTexture) {
        let normtex = this.getTextureFromNumber(mat.normalTexture.index);
        pbrMat.normal = normtex;
      }

      let pbrSchema = mat.pbrMetallicRoughness;

      pbrMat.colorFactor = pbrSchema.baseColorFactor;
      if (pbrSchema.baseColorTexture) {
        pbrMat.color = this.getTextureFromNumber(pbrSchema.baseColorTexture.index);
      }

      pbrMat.roughFactor = pbrSchema.roughnessFactor;
      pbrMat.metalFactor = pbrSchema.metallicFactor;
      if (pbrSchema.metallicRoughnessTexture) {
        pbrMat.metalRough = this.getTextureFromNumber(pbrSchema.metallicRoughnessTexture.index);
      }

      models.push(model);
      materials.push(pbrMat);
    }
    // call something like meshtomodel on each instance
    // build their associated materials
    // done :-)

    return new PBRModelImpl(this.ctx, models, materials);
  }

  private calculateTangentVectors(inst: ModelInstance) : GLAttribute {
    let pos = inst.positions;
    let tex = inst.texcoords;
    let ind = inst.indices;
    if (!tex) {
      console.warn("Texcoord required to properly calculate tangent space.");
      return null;
    }

    let vertCount = pos.count;
    let tangent : Array<vec3> = new Array(vertCount);
    let bitangent : Array<vec3> = new Array(vertCount);
    for (let i = 0; i < vertCount; i++) {
      tangent[i] = vec3.zero(vec3.create());
      bitangent[i] = vec3.zero(vec3.create());
    }

    // assume tris for now
    for (let i = 0; i < ind.count; i += 3) {
      let positions = [pos.get(ind.getIndex(i)), pos.get(ind.getIndex(i + 1)), pos.get(ind.getIndex(i + 2))];
      let texcoords = [tex.get(ind.getIndex(i)), tex.get(ind.getIndex(i + 1)), tex.get(ind.getIndex(i + 2))];
      let posA = positions[0] as vec3;
      let posB = positions[1] as vec3;
      let posC = positions[2] as vec3;
      let texA = texcoords[0] as vec2;
      let texB = texcoords[1] as vec2;
      let texC = texcoords[2] as vec2;
      
      let ABTex = vec2.sub(vec2.create(), texB, texA);
      let BCTex = vec2.sub(vec2.create(), texC, texB);

      let ABPos = vec3.sub(vec3.create(), posB, posA);
      let BCPos = vec3.sub(vec3.create(), posC, posB);

      let det = (ABTex[0] * BCTex[1] - ABTex[1] * BCTex[0]);
      let inv_det = 1 / det;

      let tan = vec3.create();
      let bitan = vec3.create();

      for (let j = 0; j < 3; j++) {
        tan[j] = (BCTex[1] * ABPos[j] - ABTex[1] * BCPos[j]) * inv_det;
      }

      for (let j = 0; j < 3; j++) {
        bitan[j] = (-BCTex[0] * ABPos[j] + ABTex[0] * BCPos[j]) * inv_det;
      }

      for (let j = 0; j < 3; j++) {
        vec3.add(tangent[i + j], tangent[i + j], tan);
        vec3.add(bitangent[i + j], bitangent[i + j], bitan);
      }
    }

    // all tangents have been computed, reduce
    for (let i = 0; i < vertCount; i++) {
      // https://gamedev.stackexchange.com/questions/68612/how-to-compute-tangent-and-bitangent-vectors
      let norm = inst.normals.get(i);
      let tan = tangent[i];
      vec3.sub(tan, tan, vec3.scale(norm, norm, vec3.dot(norm, tan)))
      vec3.normalize(tan, tan);
      // something about calculating handedness -- i would assume there's a chance that we've flipped along the way
      let hand = vec3.dot(vec3.cross(vec3.create(), norm, tan), bitangent[i]);
      if (hand < 0) {
        vec3.scale(tan, tan, -1);
      }

      tangent[i] = tan;
    }

    // lastly: pack tangent into a buffer and store
    // 12 bytes per tangent vector, 3x4byte
    let buf = new ArrayBuffer(tangent.length * 12);
    let view = new DataView(buf);
    for (let i = 0; i < vertCount; i++) {
      for (let j = 0; j < 3; j++) {
        view.setFloat32((i * 3 + j) * 4, tangent[i][j], true);
      }
    }

    let glbuf = new GLBufferImpl(this.gl, buf);
    return GLAttributeImpl.createFromValues(glbuf, 3, this.gl.FLOAT, vertCount, 0, 0);
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

  private getInstance(prim: Primitive) {
    const inst = {} as ModelInstance;
    inst.positions      = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.POSITION);
    inst.normals        = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.NORMAL);
    inst.texcoords      = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.TEXCOORD_0);
    inst.tangents       = this.createAttributeFromJSON(this.data, this.buffers, prim.attributes.TANGENT);

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

    return inst;
  }

  private meshToModel(mesh: Mesh) : Model {
    const instances : Array<ModelInstance> = [];
    for (let prim of mesh.primitives) {
      let inst = this.getInstance(prim);

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