export function makeSeededRng(seed) {
  let s = seed >>> 0
  // 0 is a fixed point of xorshift32, so give it a nonzero start state.
  if (s === 0) s = 0x9e3779b9
  return function rng() {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}
