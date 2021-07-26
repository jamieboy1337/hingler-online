import { GameContext } from "../../GameContext";
import { Framebuffer } from "../Framebuffer";
import { ColorTexture } from "./ColorTexture";
import { DepthStencilRenderbuffer } from "./DepthStencilRenderbuffer";

export class ColorFramebuffer implements Framebuffer {
  dims: [number, number];

  private colorTexture: ColorTexture;
  private dsRenderbuffer: DepthStencilRenderbuffer;
  private fb: WebGLFramebuffer;
  private gl: WebGLRenderingContext;

  constructor(ctx: GameContext, dims: [number, number]) {
    this.colorTexture = new ColorTexture(ctx, dims);
    this.dsRenderbuffer = new DepthStencilRenderbuffer(ctx, dims);
    this.gl = ctx.getGLContext();

    let gl = this.gl;
    this.fb = gl.createFramebuffer();
    this.setFramebufferSize(dims);
  }

  getColorTexture() {
    return this.colorTexture;
  }

  setFramebufferSize(dim_a: [number, number] | number, dim_b?: number) {
    this.colorTexture.setDimensions(dim_a, dim_b);
    this.dsRenderbuffer.setDimensions(dim_a, dim_b);

    this.colorTexture.attachToFramebuffer(this.fb);
    this.dsRenderbuffer.attachToFramebuffer(this.fb);
    this.dims = (typeof dim_a === "number" ? [dim_a, dim_b] : dim_a) as [number, number];
  }

  bindFramebuffer(target?: number) {
    let targ = target;
    if (!targ) {
      targ = this.gl.FRAMEBUFFER;
    }

    this.gl.bindFramebuffer(targ, this.fb);
  }


}