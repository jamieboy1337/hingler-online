import { PBRModel } from "@hingler-party/client/ts/engine/model/PBRModel";
import { mat4, quat, vec3, vec4, ReadonlyQuat, ReadonlyVec3 } from "gl-matrix";
import { FXAAFilter } from "../../../hingler-party/client/ts/engine/filter/FXAAFilter";
import { GameContext } from "../../../hingler-party/client/ts/engine/GameContext";
import { GameCamera } from "../../../hingler-party/client/ts/engine/object/game/GameCamera";
import { GameObject } from "../../../hingler-party/client/ts/engine/object/game/GameObject";
import { AmbientLightObject } from "../../../hingler-party/client/ts/engine/object/game/light/AmbientLightObject";
import { SpotLightObject } from "../../../hingler-party/client/ts/engine/object/game/light/SpotLightObject";
import { WaterField } from "./field/WaterField";
import { GameConnectionManagerSinglePlayer, PLAYER_MOTION_STATES } from "./GameConnectionManagerSinglePlayer";
import { InputManager } from "./manager/InputManager";
import { FieldManagerSinglePlayer } from "./manager/internal/FieldManagerSinglePlayer";
import { InputManagerImpl } from "./manager/internal/InputManagerImpl";
import { SkyboxManagerSinglePlayer } from "./manager/internal/SkyboxManagerSinglePlayer";
import { TileManagerSinglePlayer } from "./manager/internal/TileManagerSinglePlayer";
import { MapManager } from "./MapManager";
import { Counter } from "./ui/Counter";
import { EnemyInfo } from "./ui/EnemyInfo";

const MOVE_IMG = "../res/img/chewingcharacter_animated.gif";
const STILL_IMG = "../res/img/charactermini_still.png";

const GRASS_LEN = 1;
const BEACH_LEN = 1;
const BRIDGE_LEN = 25;
const MOUNTAIN_LEN = 11;
const LAVA_LEN = 15;


const GAMMA_POW = 2.2;

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
  private crabKills: EnemyInfo;
  private goatKills: EnemyInfo;

  private scoreCounter: Counter;

  private input: InputManager;
  private tile: TileManagerSinglePlayer;
  private field: FieldManagerSinglePlayer;

  private motionState: boolean;

  private animImage: HTMLImageElement;

  private conn : GameConnectionManagerSinglePlayer;

  private skybox: SkyboxManagerSinglePlayer;

  private curfield: FieldName;

  private termShock: GameObject;

  private statview: HTMLElement;

  private statRadius: HTMLElement;
  private statBomb: HTMLElement;
  private statSpeed: HTMLElement;

  // addanims
  private addRadius: HTMLElement;
  private addBomb: HTMLElement;
  private addSpeed: HTMLElement;

  private lastRadius: number;
  private lastBomb: number;
  private lastSpeed: number;

  private animateRadius: boolean;
  private animateBomb: boolean;
  private animateSpeed: boolean;

  private addRadiusTime: number;
  private addBombTime: number;
  private addSpeedTime: number;

  constructor(ctx: GameContext, player: PBRModel) {
    super(ctx);

    this.deathDelta = 0;
    this.resetState = true;

    this.motionState = false;

    this.animImage = document.getElementById("walk-image") as HTMLImageElement;

    let cam = new GameCamera(ctx);

    let conn = new GameConnectionManagerSinglePlayer(ctx);
    this.conn = conn;

    this.skybox = new SkyboxManagerSinglePlayer(ctx);
    this.addChild(this.skybox);

    // slow as fucking shit
    // const water = new WaterField(ctx, 60, 240);
    // water.setPosition(0, -3, 0);
    // this.addChild(water);

    this.skybox.fieldLength = GRASS_LEN * 48;
    this.skybox.beachLength = (BEACH_LEN + 2.5) * 48;

    this.statview = document.getElementById("stats-view");
    this.statRadius = document.getElementById("stat-radius");
    this.statBomb = document.getElementById("stat-maxbomb");
    this.statSpeed = document.getElementById("stat-speed");

    this.addRadius = document.getElementById("stat-contents-radius").querySelector(".stats-add");
    this.addSpeed = document.getElementById("stat-contents-speed").querySelector(".stats-add");
    this.addBomb = document.getElementById("stat-contents-maxbomb").querySelector(".stats-add");

    this.addRadius.style.filter = "opacity(0)";
    this.addSpeed.style.filter = "opacity(0)";
    this.addBomb.style.filter = "opacity(0)";

    this.animateRadius = false;
    this.animateBomb = false;
    this.animateSpeed = false;

    this.lastRadius = this.conn.getRadius();
    this.lastBomb = this.conn.getBombMax();
    this.lastSpeed = this.conn.getSpeed();


    
    this.input = new InputManagerImpl(ctx);
    this.field = new FieldManagerSinglePlayer(ctx, 11);
    this.tile = new TileManagerSinglePlayer(ctx, cam, player, this.field);

    this.field.setGrassLength(GRASS_LEN);
    this.field.setBeachLength(BEACH_LEN);

    conn.knightStart = 20;
    conn.crabStart = GRASS_LEN * 24 + 2;
    conn.goatStart = (GRASS_LEN + BEACH_LEN) * 24 + 2;

    // set connection lengths as well

    let mapmgr = new MapManager(ctx, conn, this.input, this.tile);

    this.mgr = mapmgr;

    this.addChild(conn);
    this.addChild(mapmgr);
    this.addChild(cam);

    cam.setAsActive();

    const fxaa = new FXAAFilter(ctx);
    cam.addFilter(fxaa);

    // connection needs some awareness of when beach starts
    // how best to provide that?

    // - use mapmanager to handle that, instead of passing values to each component
    //   mapmanager requires a reference to field, but thats nbd
    //   i think this is a good route, considering that map manager is pretty lightweight atm

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

    let enemyInfo = document.getElementById("enemy-info");

    this.knightKills = new EnemyInfo("../res/img/portrait_knight_final.png");
    enemyInfo.appendChild(this.knightKills.getElement());

    this.crabKills = new EnemyInfo("../res/img/portrait_crab_final.png");
    enemyInfo.appendChild(this.crabKills.getElement());

    this.goatKills = new EnemyInfo("../res/img/portrait_goat_final.png");
    enemyInfo.appendChild(this.goatKills.getElement());
  
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

    cam.setPosition(0, 55.1, 36);
    cam.fov = 21;
    cam.near = 1.0;
    cam.far = 250.0;
    cam.lookAt(0, 0, 0);

    this.deathDelta = 0;

    this.mgr.clear();
  }

  private colLerp(a: vec4, b: vec4, t: number) {
    let res = vec4.create();
    vec4.zero(res);
    let btemp = vec4.zero(vec4.create());
    vec4.copy(res, a);
    vec4.scale(res, res, t);
    vec4.copy(btemp, b);
    vec4.scale(btemp, btemp, (1 - t));
    vec4.add(res, res, btemp);
    return res;
  }

  update() {
    let motion = this.input.getInputState();
    let inmotion = false;
    let score = this.conn.getScore();

    this.skybox.updateSkyboxes(score);

    let shock = this.conn.getTermShock();
    this.tile.setTermShockPosition(shock);
    let playerpos = this.conn.getPlayerList().get(1).position;
    let shockDist = playerpos[0] - shock;

    let tShock = Math.pow(Math.min(Math.max((shockDist - 5) / 15, 0.0), 1.0), GAMMA_POW);
    let lightCol = this.colLerp([1, 1, 1, 1], [1, 0.1, 0, 1], tShock);
    let ambIntensity = tShock * 0.3;
    
    this.spotShadow.color = lightCol;
    this.ambient.intensity = ambIntensity;
    this.skybox.intensityMul = tShock;
    // map distance from player to termshock


    // 20 - like 4 or 5 : turn the screen redder, lower the ambient




    if (this.lastBomb !== this.conn.getBombMax()) {
      this.animateBomb = true;
      this.addBombTime = 0;
      this.addBomb.removeAttribute("time");
      let delta = (this.conn.getBombMax() - this.lastBomb);
      this.addBomb.textContent = (delta >= 0 ? "+" : "-") + Math.abs(delta).toString();
      this.lastBomb = this.conn.getBombMax();
    }

    if (this.lastRadius !== this.conn.getRadius()) {
      this.animateRadius = true;
      this.addRadiusTime = 0;
      this.addRadius.removeAttribute("time");
      let delta = (this.conn.getRadius() - this.lastRadius);
      this.addRadius.textContent = (delta >= 0 ? "+" : "-") + Math.abs(delta).toString();
      this.lastRadius = this.conn.getRadius();
    }

    if (this.lastSpeed !== this.conn.getSpeed()) {
      this.animateSpeed = true;
      this.addSpeedTime = 0;
      this.addSpeed.removeAttribute("time");
      let delta = (this.conn.getSpeed() - this.lastSpeed);
      this.addSpeed.textContent = (delta >= 0 ? "+" : "-") + Math.abs(delta).toFixed(2).toString();
      this.lastSpeed = this.conn.getSpeed();
    }

    if (this.animateBomb) {
      this.addBombTime = this.animateAddText(this.addBomb, this.addBombTime);
      this.animateBomb = (this.addBombTime <= 2.0);
    }

    if (this.animateRadius) {
      this.addRadiusTime = this.animateAddText(this.addRadius, this.addRadiusTime);
      this.animateRadius = (this.addRadiusTime <= 2.0);
    }

    if (this.animateSpeed) {
      this.addSpeedTime = this.animateAddText(this.addSpeed, this.addSpeedTime);
      this.animateSpeed = (this.addSpeedTime <= 2.0);
    }

    this.statRadius.textContent = this.conn.getRadius().toString();
    this.statBomb.textContent = this.conn.getBombMax().toString();
    this.statSpeed.textContent = this.conn.getSpeed().toFixed(2);

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

    // how do we control skyboxes without too much coupling?
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

    if (!this.conn.killerIsDead && this.statview.classList.contains("hidden")) {
      this.statview.classList.remove("hidden");
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
          this.statview.classList.add("hidden");
        }

        if (!scorebox.classList.contains("hidden")) {
          scorebox.classList.add("hidden");
        }

        let t = Math.pow(this.deathDelta - 0.5, 1.8);

        let score = Math.min(Math.max(t * 300, 0), Math.floor(this.conn.getScore()));
        this.counter.setValue(score);

        let knightKills = Math.min(Math.max(t * 30, 0), this.conn.getKnightKillCount());
        this.knightKills.setValue(knightKills);

        let crabKills = Math.min(Math.max(t * 30, 0), this.conn.getCrabKillCount());
        this.crabKills.setValue(crabKills);

        let goatKills = Math.min(Math.max(t * 30, 0), this.conn.getGoatKillCount());
        this.goatKills.setValue(goatKills);
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

  private vecLerp(a: ReadonlyVec3, b: ReadonlyVec3, t: number) : [number, number, number] {
    let res = [0, 0, 0] as [number, number, number];
    res[0] = (a[0] * (1 - t)) + (b[0] * t);
    res[1] = (a[1] * (1 - t)) + (b[1] * t);
    res[2] = (a[2] * (1 - t)) + (b[2] * t);

    return res;
  }

  private slerp(a: ReadonlyQuat, b: ReadonlyQuat, t: number) {
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

  private textfunc(t: number) {
    return Math.max(Math.min(1.0 - (0.5 + (Math.pow(-(t - 1), 5) / 2)), 1.0), 0.0);
  }

  // returns true if the animation should continue, false otherwise
  private animateAddText(elem: HTMLElement, t: number) {
    t += this.getContext().getDelta();

    let fade = this.textfunc(t);
    elem.style.left = (80 + (fade * 160)) + "px";
    elem.style.filter = "opacity(" + (1 * (1 - (2 * Math.abs(fade - 0.5)))) + ")";
    return t;
  }
}
