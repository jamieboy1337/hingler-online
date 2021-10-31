import { GameContext } from "../../engine/GameContext";
import { GLProgramWrap } from "../../engine/gl/internal/GLProgramWrap";
import { ShaderProgramBuilder } from "../../engine/gl/ShaderProgramBuilder";
import { Texture } from "../../engine/gl/Texture";
import { InstancedModelImpl } from "../../engine/loaders/internal/InstancedModelImpl";
import { InstancedMaterial } from "../../engine/material/InstancedMaterial";
import { TextureDummy } from "../../engine/material/TextureDummy";
import { AttributeType } from "../../engine/model/Model";
import { RenderContext } from "../../engine/render/RenderContext";

export class InstancedExplosionMaterial implements InstancedMaterial {
  private ctx: GameContext;
  private prog: WebGLProgram;
  private progWrap: GLProgramWrap;

  private tex: Texture;
  private placeholder: Texture;
  
  private locs: {
    camera_matrix: WebGLUniformLocation;
    noise_texture: WebGLUniformLocation;
  };

  private attribs: {
    position: number,
    texcoord: number,
    model_matrix: number,
    threshold: number,
    color: number,
    noise_offset: number
  };

  instanceIndices : {
    modelMat: number,
    threshold: number,
    color: number,
    noise_offset: number
  };


  constructor(ctx: GameContext) {
    this.instanceIndices = {
      modelMat: -1,
      threshold: -1,
      color: -1,
      noise_offset: -1
    };

    this.ctx = ctx;

    this.prog = null;
    this.progWrap = null;

    this.placeholder = new TextureDummy(ctx);
    this.tex = null;
    ctx.getGLTFLoader().loadTexture("../res/explosiontex.png").then((tex) => {
      this.tex = tex;
    });


    // no way to load textures yet lol

    new ShaderProgramBuilder(ctx)
      .withVertexShader("../glsl/game/explosion/explosion.vert")
      .withFragmentShader("../glsl/game/explosion/explosion.frag")
      .build()
      .then(this.configureProgram.bind(this))
      .catch(console.error.bind(console));
  }

  private configureProgram(prog: WebGLProgram) {
    let gl = this.ctx.getGLContext();
    this.prog = prog;
    this.progWrap = new GLProgramWrap(gl, this.prog);

    this.locs = {
      camera_matrix: gl.getUniformLocation(prog, "camera_matrix"),
      noise_texture: gl.getUniformLocation(prog, "noise_texture")
    };

    this.attribs = {
      position: gl.getAttribLocation(prog, "position"),
      texcoord: gl.getAttribLocation(prog, "texcoord"),
      model_matrix: gl.getAttribLocation(prog, "model_matrix"),
      threshold: gl.getAttribLocation(prog, "threshold"),
      color: gl.getAttribLocation(prog, "color"),
      noise_offset: gl.getAttribLocation(prog, "noise_offset")
    };
  }

  prepareAttributes(model: InstancedModelImpl, instances: number, rc: RenderContext) {
    let gl = this.ctx.getGLContext();

    if (this.prog !== null) {
      gl.useProgram(this.prog);

      gl.uniformMatrix4fv(this.locs.camera_matrix, false, rc.getActiveCameraInfo().vpMatrix);
      model.bindAttribute(AttributeType.POSITION, this.attribs.position);
      model.bindAttribute(AttributeType.TEXCOORD, this.attribs.texcoord);

      if (this.tex !== null) {
        this.tex.bindToUniform(this.locs.noise_texture, 6);
      } else {
        this.placeholder.bindToUniform(this.locs.noise_texture, 6);
      }
      
      for (let i = 0; i < 4; i++) {
        let loc = this.attribs.model_matrix + i;
        let byteOffset = i * 16;
        model.instanceAttribPointer(this.instanceIndices.modelMat, loc, 4, gl.FLOAT, false, 96, byteOffset);
      }

      // todo: add params for offset, stride, etc. if necessary
      model.instanceAttribPointer(this.instanceIndices.modelMat, this.attribs.threshold, 1, gl.FLOAT, false, 96, 64);
      model.instanceAttribPointer(this.instanceIndices.modelMat, this.attribs.color, 4, gl.FLOAT, false, 96, 68);
      model.instanceAttribPointer(this.instanceIndices.modelMat, this.attribs.noise_offset, 3, gl.FLOAT, false, 96, 84);
    }
  }

  cleanUpAttributes() {}
}

