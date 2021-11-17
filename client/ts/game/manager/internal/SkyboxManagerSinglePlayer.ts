import { GameContext } from "../../../../../hingler-party/client/ts/engine/GameContext";
import { GameObject } from "../../../../../hingler-party/client/ts/engine/object/game/GameObject";
import { SkyboxObject } from "../../../../../hingler-party/client/ts/engine/object/game/SkyboxObject";

const BASE_FIELD_INTENSITY = 1.0;
const BASE_BEACH_INTENSITY = 0.8;
const BASE_BRIDGE_INTENSITY = 1.0;

// just deal with the coupling in later implementations
export class SkyboxManagerSinglePlayer extends GameObject {
  private fieldSkybox: SkyboxObject;
  private beachSkybox: SkyboxObject;
  private bridgeSkybox: SkyboxObject;

  intensityMul: number;

  // length of field, in in-game units.
  fieldLength: number;
  beachLength: number;

  constructor(ctx: GameContext) {
    super(ctx);
    this.fieldSkybox = new SkyboxObject(ctx, "../res/hdr/hdr_field_1k.hdr");
    this.beachSkybox = new SkyboxObject(ctx, "../res/hdr/hdr_beach_1k.hdr");
    this.bridgeSkybox = new SkyboxObject(ctx, "../res/hdr/hdr_bridge_1k.hdr");

    this.intensityMul = 1.0;

    this.addChild(this.fieldSkybox);
    this.addChild(this.beachSkybox);
    this.addChild(this.bridgeSkybox);
  }

  updateSkyboxes(len: number) {
    if (len > (this.fieldLength + this.beachLength)) {
      const t = (len - (this.beachLength + this.fieldLength)) / 48;
      this.fieldSkybox.intensity = 0;
      this.beachSkybox.intensity = Math.max(1.0 - t, 0.0) * BASE_BEACH_INTENSITY * this.intensityMul;
      this.bridgeSkybox.intensity = Math.min(1.0, t) * BASE_BRIDGE_INTENSITY * this.intensityMul;
    } else if (len > this.fieldLength) {
      const t = (len - this.fieldLength) / 48;
      this.fieldSkybox.intensity = Math.max(1.0 - t, 0.0) * BASE_FIELD_INTENSITY * this.intensityMul;
      this.beachSkybox.intensity = Math.min(1.0, t) * BASE_BEACH_INTENSITY * this.intensityMul;
      this.bridgeSkybox.intensity = 0;
    } else {
      this.fieldSkybox.intensity = BASE_FIELD_INTENSITY * this.intensityMul;
      this.beachSkybox.intensity = 0;
      this.bridgeSkybox.intensity = 0;
    }
  }
}