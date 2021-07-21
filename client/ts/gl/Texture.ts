export enum TextureFormat {
  RGBA,
  RGB,
  DEPTH
};

export interface Texture {
  // texture dimensions
  readonly dims : [number, number];

  /**
   * Binds this texture to a provided uniform location, at the texture index specified by `index`.
   * @param index - texture index to bind to.
   * @param location - location to bind the texture to.
   */
  bindToUniform(location: WebGLUniformLocation, index: number) : void;
  getTextureFormat() : TextureFormat;
}