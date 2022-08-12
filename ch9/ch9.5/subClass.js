// サブクラス用のコンストラクタ関数。
function Span(start, span) {
  if (span >= 0) {
    this.from = start;
    this.to = start + span;
  } else {
    this.to = start;
    this.from = start + span;
  }
}

// Spanプロトタイプが、Rangeプロトタイプを継承するようにする。
Span.prototype = Object.create(Range.prototype);

// Range.prototype.constructorは継承したくないので、constructor プロパティを定義する
Span.prototype.constructor = Span;

Span.prototype.toString = function () {
  return `${this.from}...${this.to - this.from}`;
};
