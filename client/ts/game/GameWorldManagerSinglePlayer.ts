import { quat, vec3, vec4 } from "gl-matrix";
import { GameContext } from "../engine/GameContext";
import { GameCamera } from "../engine/object/game/GameCamera";
import { GameObject } from "../engine/object/game/GameObject";
import { AmbientLightObject } from "../engine/object/game/light/AmbientLightObject";
import { SpotLightObject } from "../engine/object/game/light/SpotLightObject";
import { GameConnectionManagerSinglePlayer, PLAYER_MOTION_STATES } from "./GameConnectionManagerSinglePlayer";
import { FieldManager } from "./manager/FieldManager";
import { InputManager } from "./manager/InputManager";
import { FieldManagerSinglePlayer } from "./manager/internal/FieldManagerSinglePlayer";
import { InputManagerImpl } from "./manager/internal/InputManagerImpl";
import { TileManagerSinglePlayer } from "./manager/internal/TileManagerSinglePlayer";
import { TileManager } from "./manager/TileManager";
import { MapManager } from "./MapManager";
import { Counter } from "./ui/Counter";
import { EnemyInfo } from "./ui/EnemyInfo";

const MOVE_IMG = "../res/img/chewingcharacter_animated.gif";
const STILL_IMG = "../res/img/charactermini_still.png";

const GRASS_LEN = 2;

enum FieldName {
  GRASS,
  BEACH,
  MOUNTAIN,
  LAVA
};

export class GameWorldManagerSinglePlayer extends GameObject {
  private spotShadow : SpotLightObject;
  private ambient : AmbientLightObject;
  private cam : GameCamera;
  private mgr : MapManager;

  private resetState: boolean;

  private deathDelta: number;

  private counter: Counter;
  private knightKills: EnemyInfo;

  private scoreCounter: Counter;

  private input: InputManager;
  private tile: TileManager;
  private field: FieldManagerSinglePlayer;

  private motionState: boolean;

  private animImage: HTMLImageElement;

  private conn : GameConnectionManagerSinglePlayer;

  private curfield: FieldName;

  constructor(ctx: GameContext) {
    super(ctx);

    this.deathDelta = 0;
    this.resetState = true;

    this.motionState = false;

    this.animImage = document.getElementById("walk-image") as HTMLImageElement;

    let cam = new GameCamera(ctx);

    let conn = new GameConnectionManagerSinglePlayer(ctx);
    
    
    this.conn = conn;
    
    this.input = new InputManagerImpl(ctx);
    this.field = new FieldManagerSinglePlayer(ctx, 11);
    this.tile = new TileManagerSinglePlayer(ctx, this.field);

    this.field.setGrassLength(GRASS_LEN);

    let mapmgr = new MapManager(ctx, conn, this.input, this.tile);

    this.mgr = mapmgr;

    this.addChild(conn);
    this.addChild(mapmgr);
    this.addChild(cam);
    cam.setAsActive();

    let spot = new SpotLightObject(ctx);
    let amb = new AmbientLightObject(ctx);
    this.addChild(amb);
    this.addChild(spot);

    this.spotShadow = spot;
    this.ambient = amb;
    this.cam = cam;

    this.resetObjectAttributes();

    let final = document.getElementById("retry");
    final.addEventListener("click", () => {
      this.conn.reset();
      document.getElementById("score-panel").classList.add("hidden");
    });

    this.counter = new Counter(8);

    document.getElementById("score-display").prepend(this.counter.getElement());
    this.counter.getElement().id = "score-counter";

    this.knightKills = new EnemyInfo("../res/img/portrait_knight_final.png");
    document.getElementById("enemy-info").appendChild(this.knightKills.getElement());
  
    this.scoreCounter = new Counter(8);
    document.getElementById("score-counter-screen").prepend(this.scoreCounter.getElement());
  }

  private resetObjectAttributes() {
    let spot = this.spotShadow;
    let amb = this.ambient;
    let cam = this.cam;

    spot.setPosition(-115, 400, -80);
    spot.fov = 12.0;
    spot.near = 100.0;
    spot.far = 10000.0;
    spot.falloffRadius = 0.0001;
    spot.atten_const = 1;
    spot.atten_linear = 0;
    spot.atten_quad = 0;
    spot.intensity = 1.6;
    spot.color = new Float32Array([1, 1, 1, 1]);
    spot.setShadowDims(2048, 2048);
    spot.setShadows(true);
    spot.lookAt(0, 0, 0);

    amb.color = [0.5, 0.5, 0.5, 1.0];
    amb.intensity = 0.3;

    cam.setPosition(0, 70, 32);
    cam.fov = 18;
    cam.near = 1.0;
    cam.far = 250.0;
    cam.lookAt(0, 0, 0);

    this.deathDelta = 0;

    this.mgr.clear();
  }

  update() {
    let motion = this.input.getInputState();
    let inmotion = false;
    let score = this.conn.getScore();
    for (let input of PLAYER_MOTION_STATES) {
      inmotion = inmotion || motion.has(input);
    }

    if (inmotion !== this.motionState) {
      if (inmotion) {
        this.animImage.src = MOVE_IMG;
      } else {
        this.animImage.src = STILL_IMG;
      }
    }

    this.motionState = inmotion;

    let scorebox = document.getElementById("score-counter-screen");
    this.scoreCounter.setValue(Math.floor(score));
    if (scorebox.classList.contains("hidden")) {
      scorebox.classList.remove("hidden");
    }

    let dist = score / 48;
    let newfield : FieldName;

    if (dist > GRASS_LEN) {
      newfield = FieldName.BEACH;
    } else {
      newfield = FieldName.GRASS;
    }

    if (newfield !== this.curfield) {
      let fg = document.getElementById("field-fg") as HTMLImageElement;
      let bg = document.getElementById("field-bg") as HTMLImageElement;
      switch (newfield) {
        case FieldName.BEACH:
          fg.src = "../res/img/fieldminis/beach_fg.png";
          bg.src = "../res/img/fieldminis/beach_bg.png";
          break;
        case FieldName.GRASS:
        default:
          fg.src = "../res/img/fieldminis/field_fg.png";
          bg.src = "../res/img/fieldminis/field_bg.png";
          break;
      }

      this.curfield = newfield;
    }

    if (this.conn.killerIsDead) {
      // toggle a flicket which positions the player
      // we need to figure out where the player is
      let player = this.mgr.getPlayerPosition(1);
      let delta = this.getContext().getDelta();

      this.deathDelta += delta;

      let final = document.getElementById("score-panel");
      if (this.deathDelta > 0.5) {
        if (final.classList.contains("hidden")) {
          final.classList.remove("hidden");
        }

        if (!scorebox.classList.contains("hidden")) {
          scorebox.classList.add("hidden");
        }

        let t = Math.pow(this.deathDelta - 0.5, 1.8);

        let score = Math.min(Math.max(t * 300, 0), Math.floor(this.conn.getScore()));
        this.counter.setValue(score);

        let knightKills = Math.min(Math.max(t * 30, 0), this.conn.getKnightKillCount());
        this.knightKills.setValue(knightKills);
      }

      this.resetState = false;

      let t = 1.0 - Math.pow(0.1, delta);
      let rot = this.cam.getRotation();
      let pos = this.cam.getPosition();

      this.cam.lookAt(player);
      let rotDest = this.cam.getRotation() as quat;
      let posDest = [player[0] + 4, player[1] + 12.5, player[2] + 3] as vec3;
      let posRes = this.vecLerp(pos, posDest, t);
      this.cam.setPosition(posRes);
      this.cam.setRotationQuat(this.slerp(rot, rotDest, t));
      this.spotShadow.intensity = this.spotShadow.intensity * (1 - t);
      this.cam.fov = this.cam.fov * (1 - t) + 35 * t;
    } else if (!this.resetState) {
      this.resetState = true;
      this.resetObjectAttributes();
    }

    // add counter to top of screen
  }

  private vecLerp(a: vec3, b: vec3, t: number) : [number, number, number] {
    let res = [0, 0, 0] as [number, number, number];
    res[0] = (a[0] * (1 - t)) + (b[0] * t);
    res[1] = (a[1] * (1 - t)) + (b[1] * t);
    res[2] = (a[2] * (1 - t)) + (b[2] * t);

    return res;
  }

  private slerp(a: quat, b: quat, t: number) {
    let dot = quat.dot(a, b);
    
    let res = quat.create();
    quat.copy(res, a);
    if (dot < 0) {
      quat.scale(res, res, -1);
    }
    quat.invert(res, res);
    quat.multiply(res, res, b);
    quat.pow(res, res, t);
    quat.mul(res, a, res);
    return res;
  }
}