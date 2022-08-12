/**
 * クロージャの例
 * 
 */
const scope = "global scope";

function checkScope(){
  const scope = "local scope"
  function f(){return scope;}
  return f;
}
// 関数を実行する時は、関数が定義された時に有効であった変数スコープを使う
const s = checkScope()();


/**
 * クロージャ応用例
 * ローカル変数をプライベート変数みたいに使う
 * 
 */
let uniqueInteger = (function(){
  let count = 0;
  return function(){
    return count++;
  }
}());

console.log(uniqueInteger()); // => 0
console.log(uniqueInteger()); // => 1

let uniqueInteger2 = function(){
  let count = 0;
  return function(){
    return count++;
  }
}();
// uniqueInteger2 = f(){return count++;}

let uniqueInteger3 = function(){
  let count = 0;
  return function(){
    return count++;
  }
};
// uniqueInteger3 = function(){
//   let count = 0;
//   return function(){
//     return count++;
//   }
// };
