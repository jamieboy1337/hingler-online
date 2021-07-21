import { BufferTarget, DataType, DrawMode, GLBuffer } from "./GLBuffer";

/**
 * Represents a GL ArrayBuffer.
 * TODO: this is implementing two things in one place.
 *       create a different implementation specifically for element arrays?
 * 
 *       I won't worry about it for now because this class is internal only
 */
export class GLBufferImpl implements GLBuffer {
  buf: ArrayBuffer;
  glBuf: WebGLBuffer;
  view: DataView;
  gl: WebGLRenderingContext;
  target: BufferTarget;

  dataMode: number;

  // TODO: assign a target on ctor? (array / element array / etc?)
  // we'd have a confusing dependency :( but even then it like won't matter
  // it's just a safeguard for me, so that we have a bit more info instead of just crashing out
  constructor(gl: WebGLRenderingContext, buffer: ArrayBuffer, dataMode?: number) {
    this.buf = buffer;
    this.glBuf = gl.createBuffer();
    this.view = new DataView(this.buf);
    this.target = BufferTarget.UNBOUND;
    this.gl = gl;

    if (dataMode === undefined) {
      this.dataMode = gl.STATIC_DRAW;
    } else {
      this.dataMode = dataMode;
    }
  }

  private bindAndPopulate(target: BufferTarget) {
    let gl = this.gl;
    let targ : number;
    switch (target) {
      case BufferTarget.ARRAY_BUFFER:
        targ = gl.ARRAY_BUFFER;
        break;
      case BufferTarget.ELEMENT_ARRAY_BUFFER:
        targ = gl.ELEMENT_ARRAY_BUFFER;
        break;
    }

    gl.bindBuffer(targ, this.glBuf);
    gl.bufferData(targ, this.buf, gl.STATIC_DRAW);
    this.target = target;
  }
  
  bindToVertexAttribute(location: number, components: number, type: number, normalize: boolean, stride: number, offset: number) {
    if (this.target === BufferTarget.UNBOUND) {
      this.bindAndPopulate(BufferTarget.ARRAY_BUFFER);
    } else if (this.target !== BufferTarget.ARRAY_BUFFER) {
      let err = `WebGL buffers cannot be multi-purpose!`;
      console.warn(err);
      throw Error(err);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuf);
    this.gl.vertexAttribPointer(location, components, type, normalize, stride, offset);
    this.gl.enableVertexAttribArray(location);
  }

  disableVertexAttribute(location: number) {
    this.gl.disableVertexAttribArray(location);
  }

  drawElements(offset: number, count: number, dataType: DataType, mode?: DrawMode) {
    if (this.target === BufferTarget.UNBOUND) {
      this.bindAndPopulate(BufferTarget.ELEMENT_ARRAY_BUFFER);
    } else if (this.target !== BufferTarget.ELEMENT_ARRAY_BUFFER) {
      let err = `WebGL buffers cannot be multi-purpose!`;
      console.warn(err);
      throw Error(err);
    }

    let gl = this.gl;
    let glMode : number;
    if (mode === undefined) {
      glMode = gl.TRIANGLES;
    } else {
      switch (mode) {
        case DrawMode.TRIANGLES:
          glMode = gl.TRIANGLES;
          break;
        case DrawMode.LINES:
          glMode = gl.LINES;
          break;
        case DrawMode.POINTS:
          glMode = gl.POINTS;
          break;
      }
    }

    let type : number;
    switch (dataType) {
      case DataType.BYTE:
        type = gl.BYTE;
        break;
      case DataType.UNSIGNED_BYTE:
        type = gl.UNSIGNED_BYTE;
        break;
      case DataType.SHORT:
        type = gl.SHORT;
        break;
      case DataType.UNSIGNED_SHORT:
        type = gl.UNSIGNED_SHORT;
        break;
      case DataType.INT:
        type = gl.INT;
        break;
      case DataType.UNSIGNED_INT:
        type = gl.UNSIGNED_INT;
        break;
      default:
        let err = `Unhandled data type: ${dataType}`;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuf);
    gl.drawElements(glMode, count, type, offset);
  }

  getInt8(offset: number) {
    return this.view.getInt8(offset);
  }

  getUint8(offset: number) {
    return this.view.getUint8(offset);
  }

  getInt16(offset: number, littleEndian?: boolean) {
    return this.view.getInt16(offset, littleEndian);
  }

  getUint16(offset: number, littleEndian?: boolean) {
    return this.view.getUint16(offset, littleEndian);
  }

  getInt32(offset: number, littleEndian?: boolean) {
    return this.view.getInt32(offset, littleEndian);
  }

  getUint32(offset: number, littleEndian?: boolean) {
    return this.view.getUint32(offset, littleEndian);
  }
  
  getFloat32(offset: number, littleEndian?: boolean) {
    return this.view.getFloat32(offset, littleEndian);
  }
  
  copy() : GLBuffer {
    return new GLBufferImpl(this.gl, this.buf, this.dataMode);
  }
}

// NOTE: Our GLBuffer should handle all commands pertaining to GL state. No other model-related
// class should have any idea that the GL state machine exists, and should work through this buffer exclusively!

// TODO: Work on making that consistent. Eliminate dependencies.
// Then write a stub which we can use elsewhere (factor out into interface and impl)