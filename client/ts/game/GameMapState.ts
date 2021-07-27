export interface GameMapState {
  readonly dims: [number, number];
  readonly tiles: Uint8Array;
}