export class CounterDigit {
  // set digit (0 - 10)
  private digitTop: HTMLElement;
  private digitMiddle: HTMLElement;
  private digitBottom: HTMLElement;

  private digitContainer: HTMLElement;

  private digitStyle: HTMLElement;

  private value: number;
  private anchor: number;

  private heightCache: number;

  private animate: boolean;

  /**
   * 
   * @param parent - selector identifying initial parent.
   */
  constructor() {
    this.digitStyle = document.createElement("div");

    this.digitStyle.textContent = "0";

    this.digitContainer = document.createElement("div");
    this.digitTop = document.createElement("div");
    this.digitMiddle = document.createElement("div");
    this.digitBottom = document.createElement("div");

    this.digitContainer.appendChild(this.digitTop);
    this.digitContainer.appendChild(this.digitMiddle);
    this.digitContainer.appendChild(this.digitBottom);

    this.digitContainer.classList.add("counter-container");
    this.digitStyle.classList.add("counter");

    this.digitStyle.appendChild(this.digitContainer);

    this.animate = true;

    this.value = 0;
    this.anchor = 0;

    window.addEventListener("resize", () => {
      // assume that we'll only have to resize counters when the window fucks up
      this.heightCache = 0;
    });

    this.updateDigitState();
  }

  toggleAnimation(animate: boolean) {
    this.animate = animate;
    if (!animate) {
      this.digitContainer.style.top = (this.heightCache * -1) + "px";
    }
  }

  private updateDigitState() {
    let low = (this.anchor + 9) % 10;
    let mid = this.anchor % 10;
    let hi = (this.anchor + 1) % 10;
    // might be really slow :(
    this.digitTop.textContent = low.toString();
    this.digitMiddle.textContent = mid.toString();
    this.digitBottom.textContent = hi.toString();
    let offset = this.value - this.anchor;

    if (this.animate) {
      if (this.heightCache <= 0) {
        this.heightCache = (this.digitMiddle.clientHeight);
      }
      let offsetHTML = this.heightCache * (-1 - offset);
      this.digitContainer.style.top = offsetHTML + "px";
    } else if (this.heightCache <= 0) {
      this.heightCache = this.digitMiddle.clientHeight;
      this.digitContainer.style.top = (this.heightCache * -1) + "px";
    }
  }

  appendTo(elem: HTMLElement) {
    if (this.digitStyle.parentNode) {
      this.digitStyle.parentNode.removeChild(this.digitStyle);
    }

    elem.appendChild(this.digitStyle);
    this.heightCache = this.digitMiddle.clientHeight;
    
    this.updateDigitState();
  }

  private updateDigitSize() {
    this.digitContainer.style.height = this.digitMiddle.clientHeight + "px";
    console.log(this.digitMiddle.clientHeight);
  }

  setValue(val: number) {
    val = (val < 0 ? -val : val);
    let res = val % 10;
    this.value = res;
    this.anchor = Math.round(this.value);
    this.updateDigitState();
  }
}