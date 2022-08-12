const array = [1,2,3];
// max() の引数に配列を入れたい場合、スプレッド構文で展開する必要がある。
const max = Math.max(array); // => NaN 
// ES5以前は、以下のようにしていた。
// f.apply(o,array) は、o.f(...array) と同じ
const max2 = Math.max.apply(Math,array); // => 3


/**
 * 指定したオブジェクトのメソッドが呼び出し前と呼び出し後の時間を
 * メッセージログに残すようになります。
 * 
 * @param {*} o オブジェクト
 * @param {*} m メソッド名
 */
function trace(o,m){
  const original = o[m];
  o[m] = function(...args){
    console.log(new Date(), "Entering:",m);
    // this はメソッドを持つオブジェクトを指す
    const result = original.apply(this,args);
    console.log(new Date(), "Exiting:", m);
    return result;
  }
}
