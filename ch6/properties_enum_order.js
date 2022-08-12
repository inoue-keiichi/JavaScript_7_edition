/**
 * プロパティの列挙順序
 * 1. キーが非負の整数の小さい順に
 * 2. キーが文字列をプロパティに追加した順で（負数や浮動小数点も）
 * 3. Symbolを追加した順に
 * 
 */

const hoge = { 
  "-2":"a",
  "-1":"b",
  3:"c",
  "2":"d",
  "1":"e",
  0:"f",
  "apple":"g",
  "cheeze":"h",
  [Symbol("dinner")]:"",
  [Symbol("dinner")]:"",
  "butter":"i",
  "-3":"j"
}

console.log(Object.keys(hoge));
console.log(Reflect.ownKeys(hoge));

/**
 * 独自プロパティを列挙後、プロトタイプチェーンのプロパティを同じ順で列挙する
 * 
 */
const fuga = Object.create(hoge);
fuga.dinner="k";
fuga[4]="l";
fuga[5]="m";

for(f in fuga){
  console.log(f);
}
