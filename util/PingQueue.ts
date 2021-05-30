export class PingQueue {
  private arr: Array<number>;
  private capacity: number;
  private ind: number;
  
  constructor(len: number) {
    this.arr = [];
    this.capacity = len;
    this.ind = 0;
  }

  enqueue(ping: number) {
    this.arr[this.ind++] = ping;

    if (this.ind >= this.capacity) {
      this.ind -= this.capacity;
    }
  }

  getAverage() : number {
    if (this.arr.length === 0) {
      return NaN;
    }
    

    let coll = 0;
    
    // prioritize newer data over older
    return this.arr.reduce((acc, val, ind) => {
      let wgt = Math.pow((this.capacity - (ind - this.ind)) % this.capacity, 0.8);
      let res = acc + (val * wgt);
      coll += wgt;
      return res
    }) / coll;
  }
}