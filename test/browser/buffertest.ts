import { assert, expect } from "chai";
import { BufferTarget, DataType } from "../../client/ts/gl/internal/GLBuffer";
import { GLBufferImpl } from "../../client/ts/gl/internal/GLBufferImpl";

const canvas = document.getElementById("webgl") as HTMLCanvasElement;
const gl = canvas.getContext("webgl");

describe("GLBuffer", function() {
  it("Should instantiate itself without crashing", function() {
    let buf = new ArrayBuffer(16);
    let buffer = new GLBufferImpl(gl, buf);
  });

  it("Should return buffer data accurately", function() {
    let buf = new ArrayBuffer(32);
    let view = new DataView(buf);
    view.setInt8(0, 64);
    view.setUint8(1, 128);

    view.setInt16(2, 256, true);
    view.setUint16(4, 512, true);

    view.setInt32(6, 1024, true);
    view.setUint32(10, 2048, true);

    view.setFloat32(14, 409.6, true);

    let buffer = new GLBufferImpl(gl, buf);

    expect(buffer.getInt8(0)).to.equal(64);
    expect(buffer.getUint8(1)).to.equal(128);
    expect(buffer.getInt16(2, true)).to.equal(256);
    expect(buffer.getUint16(4, true)).to.equal(512);
    expect(buffer.getInt32(6, true)).to.equal(1024);
    expect(buffer.getUint32(10, true)).to.equal(2048);
    expect(buffer.getFloat32(14, true)).to.be.approximately(409.6, 0.001);
  });

  it("Should block arrays from being used for both array and element array", function() {
    let buf = new ArrayBuffer(32);
    let glProxy = new Proxy(gl, {
      get: function(target, prop, receiver) {
        // let everything through except drawelements, which we want to nop
        if (prop === "drawElements") {
          return (...temp: any) => null;
        } else {
          console.log(receiver);
          let res = target[prop];
          if (typeof res === "function") {
            return res.bind(gl);
          }

          return res;
        }
      }
    })

    let glbuf = new GLBufferImpl(glProxy, buf);
    glbuf.bindToVertexAttribute(0, 2, gl.FLOAT, false, 0, 0);
    assert.throw(() => glbuf.drawElements(0, 1, gl.UNSIGNED_SHORT));
    
    
  })
})