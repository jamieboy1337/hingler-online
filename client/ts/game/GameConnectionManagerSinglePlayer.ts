import { GameContext } from "../engine/GameContext";
import { GameObject } from "../engine/object/game/GameObject";
import { GameConnectionManager } from "./GameConnectionManager";

// implement as game object so that we can receive update from root object
// alternatively: we give it to some manager component which promises to update it
// the manager component can handle dialogue, etc.
// i'll do it later :)
// export class GameConnectionManagerSinglePlayer extends GameObject implements GameConnectionManager {
//   constructor(ctx: GameContext) {
//     super(ctx);
//   }

//   getMapState() {
//     // return an internally-managed game map state which generates and returns tiles on the fly
//   }


// }