import { Counter } from "./game/ui/Counter";
import { EnemyInfo } from "./game/ui/EnemyInfo";

window.addEventListener("load", main);

let c : Array<Counter>;
let g : Array<EnemyInfo>;
let p: number;

function main() {
  c = [];
  g = [];
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

  let jank = new EnemyInfo("../res/img/portrait_knight_final.png");
  document.getElementById("enemy-info").appendChild(jank.getElement());
  g.push(jank);
}

function test() {
  // create a wide counter
  let f = 5 * Math.sin(performance.now() / 1000.0) + 5;
  for (let i = 0; i < c.length; i++) {
    c[i].setValue(performance.now() / 50 - p);
  }

  for (let i = 0; i < g.length; i++) {
    g[i].setValue((performance.now() / 50 - p) / 10);
  }
  requestAnimationFrame(test);
}