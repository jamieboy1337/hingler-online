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
    
    return this.arr.reduce((acc, val) => acc + val) / this.arr.length;
  }
}