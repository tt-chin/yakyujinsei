// 生涯用RNG。状態は常に getState().rngState に保持し、このクラス自身は状態を持たない。
export class Rng {
  constructor(getState, hash) { this.getState = getState; this.hash = hash; }
  seed(seed) { const S = this.getState(); S.rngState = this.hash('v1:' + seed) || 0x6D2B79F5; }
  next() { const S = this.getState(); S.rngState=(S.rngState+0x6D2B79F5)>>>0;let t=S.rngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296; }
}
