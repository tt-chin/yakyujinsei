// S 外の生涯進行状態（年度ステップ列、選択肢制御、オフシーズン年俸・NPB復帰・年度決算の進行中コンテキスト）。値を保持するだけで、リセット処理は持たない。
export class CareerSession {
  constructor() {
    this.stepQ = [];
    this.choiceGeneration = 0;
    this.activeChoiceToken = null;
    this.resultViewDepth = 0;
    this.currentChoiceAction = null;
    this.currentChoiceContext = null;
    this.pendingOffseasonSalary = null;
    this.npbReturnOfferContext = null;
    this.seasonEndContext = null;
    this.corpSettlements = new WeakMap();
  }
}
