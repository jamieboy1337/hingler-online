import { vec3 } from "gl-matrix";
import { TileID } from "./TileID";

export interface LayerInstance {
  // type of instance this is.
  type: TileID;

  // position of this instance.
  // x/y are in tile space, z is world coordinates, relative to tile grid.
  position: vec3;
}