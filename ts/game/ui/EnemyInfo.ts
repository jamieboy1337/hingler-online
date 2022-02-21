import { Counter } from "./Counter";

export class EnemyInfo {
  private img: HTMLImageElement;
  private counter: Counter;
  private wrapper: HTMLElement;

  constructor(imageURL: string) {
    this.img = new Image();
    this.img.src = imageURL;

    this.counter = new Counter(4);
    this.counter.setValue(0);

    this.wrapper = document.createElement("div");
    this.wrapper.appendChild(this.img);
    this.wrapper.appendChild(this.counter.getElement());

    this.wrapper.classList.add("enemy");
    this.counter.getElement().classList.add("enemy-counter");
  }

  getElement() {
    return this.wrapper;
  }

  toggleAnimation(animate: boolean) {
    this.counter.toggleAnimation(animate);
  }

  setValue(val: number) {
    this.counter.setValue(val);
  }
}