// S 外の生涯進行状態（年度ステップ列と選択肢制御）。値を保持するだけで、リセット処理は持たない。
export class CareerSession {
  constructor() {
    this.stepQ = [];
    this.choiceGeneration = 0;
    this.activeChoiceToken = null;
    this.resultViewDepth = 0;
    this.currentChoiceAction = null;
    this.currentChoiceContext = null;
  }
}
