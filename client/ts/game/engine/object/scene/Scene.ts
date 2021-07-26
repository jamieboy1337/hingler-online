import { GameContext } from "../../GameContext";
import { GameObject } from "../game/GameObject";
import { GameObjectRoot } from "./internal/GameObjectRoot";

/**
 * Contains the contents of our level.
 * Scenes should expose a single root level component for the game view,
 * representing the root object of their scene. All other components
 * should be attached to this root.
 */
export abstract class Scene {
  private gameRoot: GameObjectRoot;
  private ctx: GameContext;
  private initialized: boolean;
  
  constructor() {
    this.initialized = false;
    this.gameRoot = null;
  }

  /**
   * 
   * @returns the root game object.
   */
  getGameObjectRoot() : GameObjectRoot {
    return this.gameRoot;
  }

  /**
   * Implemented for custom scenes.
   * Creates all objects which participate in the scene.
   * @param ctx - context passed in on init.
   */
  abstract initialize(ctx: GameContext) : void;

  begininit(ctx: GameContext) : void {
    // no async loading in js
    this.ctx = ctx;
    this.gameRoot = new GameObjectRoot(this.ctx);
    this.initialize(this.ctx);
    this.initialized = true;
  }

  isInitialized() : boolean {
    return this.initialized;
  }

  isLoaded() : boolean {
    if (this.initialized) {
      return (this.ctx.getFileLoader().getFractionLoaded() >= 0.999);
    }

    return false;
  }
}