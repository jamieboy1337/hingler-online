import { Texture } from "../gl/Texture";
import { Model } from "../storage/Model";
import { PBRModel } from "../storage/PBRModel";

/**
 * Represents the data contained inside a GLTF file
 * in a way which allows users to fetch data from it.
 */
export interface GLTFScene {
  /**
   * 
   * @param name - the name of the desired texture within the GLTF file, or its index.
   * @returns the texture which has the desired name, or null if the texture could not be found.
   */
  getTexture(name: string) : Texture;

  /**
   * @param name - the name of the desired model.
   * @returns the model, with no associated materials or textures attached.
   */
  getModel(name: string | number) : Model;

  /**
   * 
   * @param model - either the name of the model, or the index associated with it.
   * @returns a new PBRModel.
   */
  getPBRModel(model: string | number) : PBRModel;

  getModelCount() : number;

  // TODO: getPBRModel -- handle materials, textures, etc. if available.
}