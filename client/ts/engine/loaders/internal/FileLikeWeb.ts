import { ArrayBufferToString } from "../../../../../ts/util/StringToArrayBuffer";
import { FileLike } from "../FileLike";

export class FileLikeWeb implements FileLike {
  private buffer: ArrayBuffer;
  private bufferPromise: Promise<void>;

  constructor(resp: Response) {
    this.buffer = null;
    this.bufferPromise = resp.arrayBuffer().then((r) => {
      this.buffer = r;
    });
    // assume utf8 for now :(
  }

  asString() {
    if (this.buffer === null) {
      return null;
    }

    return ArrayBufferToString(this.buffer);
  }

  asArrayBuffer() {
    return this.buffer.slice(0);
  }

  async waitUntilReady() {
    await this.bufferPromise;
  }

  ready() {
    return (this.buffer !== null);
  }
}