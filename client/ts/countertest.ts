import { Counter } from "./game/ui/Counter";

window.addEventListener("load", main);

let c : Array<Counter>;
let p: number;

function main() {
  c = [];
  for (let i = 0; i < 16; i++) {
    c.push(new Counter(8));
    // c[i].toggleAnimation(false);
    let co = c[i];
    document.getElementById("hello").appendChild(co.getElement());
    co.getElement().classList.add("counter-full");
  }

  c.push(new Counter(8));
  c[16].getElement().id = "score-counter";
  document.getElementById("score-display").prepend(c[16].getElement());
  p = performance.now() / 50;
  requestAnimationFrame(test);
}

function test() {
  // create a wide counter
  let f = 5 * Math.sin(performance.now() / 1000.0) + 5;
  for (let i = 0; i < c.length; i++) {
    c[i].setValue(performance.now() / 50 - p);
  }
  requestAnimationFrame(test);
}