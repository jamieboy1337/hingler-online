import { GameContext } from "../../game/engine/GameContext";
import { Sampler } from "../../game/engine/loaders/internal/gltfTypes";
import { Texture, TextureFormat } from "../Texture";

export class GLTFTexture implements Texture {
  private dims_: [number, number];

  private tex: WebGLTexture;
  private gl: WebGLRenderingContext;
  private img: HTMLImageElement;
  private sampler: Sampler;

  constructor(gl: WebGLRenderingContext, buf: ArrayBuffer, sampler: Sampler, mime: string) {
    this.gl = gl;
    // https://gist.github.com/candycode/f18ae1767b2b0aba568e
    let urlCreator = window.URL || window.webkitURL;
    let url = urlCreator.createObjectURL(new Blob([buf], {type: mime}));
    this.img = new Image();
    this.img.src = url;
    this.sampler = sampler;

    this.tex = null;
    this.img.addEventListener("load", this.loadTexture.bind(this));
  }

  get dims() {
    return this.dims_;
  }

  getTextureFormat() {
    return TextureFormat.RGBA;
  }

  bindToUniform(location: WebGLUniformLocation, index: number) {
    let gl = this.gl;
    if (index > 31 || index < 0) {
      let err = "Index OOB on GLTF Texture!";
      console.error(err);
    }

    
    if (this.tex !== null) {
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(location, index);
    }
  }

  private loadTexture() {
    this.dims_ = [this.img.width, this.img.height];
    let gl = this.gl;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);

    let mag = (this.sampler.magFilter ? this.sampler.magFilter : gl.LINEAR);
    let min = (this.sampler.minFilter ? this.sampler.minFilter : gl.LINEAR);

    let wrapS = (this.sampler.wrapS ? this.sampler.wrapS : gl.REPEAT);
    let wrapT = (this.sampler.wrapT ? this.sampler.wrapT : gl.REPEAT);
    // nonstandard: webgl1 doesn't like npot textures w repeat
    // if either is set to repeat

    // if pot: both will be 0, else non 0
    let npot = (this.dims_[0] & (this.dims_[0] - 1)) || (this.dims_[1] & (this.dims_[1] - 1));
    // account for potential mipmap generation
    if ([9984, 9985, 9986, 9987].indexOf(min) !== -1) {
      // min filter uses mipmaps -- ensure they are generated
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    if (npot) {
      wrapS = (wrapS === gl.REPEAT ? gl.CLAMP_TO_EDGE : wrapS);
      wrapT = (wrapT === gl.REPEAT ? gl.CLAMP_TO_EDGE : wrapT);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  }
}