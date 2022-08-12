// クラスを定義する関数
function Range(from, to) {
  // フィールド
  this.from = from;
  this.to = to;

  // 全 Range オブジェクトがこのオブジェクトを継承する
  // プロパティは prototype でなければならない
  Range.prototype.includes = function (x) {
    return this.from <= x && x <= this.to;
  };
}

const r = new Range(1, 4);
console.log(`includes 2:${r.includes(2)}`);
console.log(`r instanceof Range:${r instanceof Range}`);
