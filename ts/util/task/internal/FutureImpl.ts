import { Future } from "../Future";

// why create this at all?

// promises pop onto the event loop, meaning that values which are immediately avail must cycle

// this gives us a synchronous path through which values can be returned instantly if avail

// this is particularly useful for cached shader retrieval, as the promise path otherwise
// requires us to do everything synchronously (which hangs our program) or do everything async
// which leads to a delay in shader fetching
export class FutureImpl<T> implements Future<T> {
  resolved: boolean;
  value: T;
  valuePromise: Promise<void>;

  private res: () => void;
  private rej: () => void;

  constructor() {
    this.resolved = false;
    this.value = null;
    this.valuePromise = new Promise((res, rej) => {
      this.res = res;
      this.rej = rej;
    });
  }

  valid() {
    return (this.resolved === true);
  }

  async wait() : Promise<T> {
    if (this.resolved) {
      return Promise.resolve(this.value);
    } else {
      await this.valuePromise;
      return this.value;
    }
  }

  get() {
    if (this.resolved) {
      return this.value;
    }

    return null;
  }

  setValue(value: T) {
    this.value = value;
    this.resolved = true;
    this.res();
  }
}