import { CounterDigit } from "./CounterDigit";

export class Counter {
  private digits: Array<CounterDigit>;
  private digitContainer: HTMLElement;
  private value: number;
  private init: boolean;

  private animate: boolean;

  constructor(width: number) {
    this.animate = true;
    this.digits = new Array(width);
    this.digitContainer = document.createElement("div");
    this.init = false;

    for (let i = width - 1; i >= 0; i--) {
      this.digits[i] = new CounterDigit();
      this.digits[i].appendTo(this.digitContainer);
    }

    this.setValue(0);
  }

  toggleAnimation(animate: boolean) {
    for (let digit of this.digits) {
      digit.toggleAnimation(animate);
    }

    this.animate = animate;
  }

  setValue(val: number) {
    if (!this.animate) {
      val = Math.floor(val);
    }

    if (val !== this.value || !this.init) {
      this.init = true;
      this.value = val;
      let valueMod = val;
      // store offset of last digit
      // if it's about to slide over (> 9), add to ours
      // offset should be floored
  
      // ensures that the first digit rolls over correctly
      let offsetLast = (this.animate ? 9 + (val % 1) : 0);
      let offsetCur : number;
      for (let i = 0; i < this.digits.length; i++) {
        offsetCur = Math.floor(valueMod % 10);
        if (offsetLast > 9) {
          offsetCur += (offsetLast - 9);
        }
  
        this.digits[i].setValue(offsetCur);
        offsetLast = offsetCur;
        valueMod = valueMod / 10;
      }
    }
  }

  getElement() {
    this.init = false;
    return this.digitContainer;
  }
}