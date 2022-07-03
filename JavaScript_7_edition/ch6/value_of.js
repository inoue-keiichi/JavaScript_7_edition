/**
 * オブジェクトを文字列以外の基本型に変換する必要があるときに
 * valueOf() が自動で呼び出される
 * 
 */
const point = {
  x:3,
  y:4,
  valueOf: function(){
    return Math.hypot(this.x,this.y); 
  }
}

// 数値比較するので、数値へ変換する必要がある
console.log(point > 4);
console.log(point > 5);
console.log(point < 6);
