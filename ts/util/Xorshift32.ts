
let s: number = 3662;
const int32_max = 4294967295;

/**
 * @returns a random 32 bit integer.
 */
export function xorshift32() {
  let x = s;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  // constrain to 32 bits
  x &= -1;
  let res = s;
  s = x;
  return res;
}

/**
 * @returns A floating point number from 0 to 1.
 */
export function xorshift32_float() {
  let res = xorshift32();
  return res / (int32_max) + 0.5;
}

export function xorshift32_seed(seed: number) {
  s = seed;
  // flush out the seed
  xorshift32();
  xorshift32();
  xorshift32();
}