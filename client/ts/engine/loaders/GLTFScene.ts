import { Texture } from "../gl/Texture";
import { Model } from "../storage/Model";

/**
 * Represents the data contained inside a GLTF file
 * in a way which allows users to fetch data from it.
 */
export interface GLTFScene {
  /**
   * 
   * @param name - the name of the desired texture within the GLTF file.
   * @returns the texture which has the desired name, or null if the texture could not be found.
   */
  getTexture(name: string) : Texture;

  /**
   * @param name - the name of the desired model.
   * @returns the model, with no associated materials or textures attached.
   */
  getModel(name: string) : Model;

  // TODO: getGLTFModel -- handle materials, textures, etc. if available.
}