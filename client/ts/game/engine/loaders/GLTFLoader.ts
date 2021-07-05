import { Model } from "../storage/Model";

/**
 * Handles loading of GLTF files and binaries.
 * smiling wide as an ape while typing this
 * 
 * model will have to be tested via a render
 * writing a tester would involve knowing the precise contents of a file
 * which would probably involve writing another parser
 */
export interface GLTFLoader {
  loadGLTFModel(path: string) : Promise<Array<Model>>;
}