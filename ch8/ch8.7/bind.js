/**
 * 関数文
 * 呼び出し方で this が変わる
 */
param = "global param";

function printParam () {
  console.log(this.param);
};

const obj = {
  param: "obj param",
  func: printParam
};

const obj2 = {
  param: "obj2 param",
  func: printParam
};

printParam(); // => grobal param
obj.func();   // => obj param
obj2.func();  // => obj2 param


/**
 * アロー関数
 * 定義した時の this を見るので固定化される
 */
const printParamArrow = () => {
  console.log(this.param);
}

obj.func = printParamArrow;
obj2.func = printParamArrow;

printParamArrow(); // => grobal param
obj.func();        // => grobal param
obj2.func();       // => grobal param

/**
 * bind()
 * bind の引数のオブジェクトに this が固定化される
 */
const f = printParam.bind(obj);
obj.func = f;
obj2.func = f;

printParam(); // => grobal param
obj.func();        // => obj param
obj2.func();       // => obj param
