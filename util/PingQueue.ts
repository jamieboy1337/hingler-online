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
    return this.arr.reduce((acc, val) => acc + val) / this.arr.length;
  }
}