// id は # で表現
// space の後は子孫要素を指定する
console.log(`#descendants span:`);
console.log(document.querySelector("#descendants span"));
// > の後は子要素を指定する
console.log(`#descendants>span:`);
console.log(document.querySelector("#descendants>span"));
console.log("body>h1:");
console.log(document.querySelector("body>h1"));
// : は擬似クラス
// <body>の最初に<h1>を書かないと null になった
console.log("body>h1:first-child:");
console.log(document.querySelector("body>h1:first-child"));
// ~ は ~ の前に記載した要素の後に続く兄弟要素
console.log("h2~span:");
console.log(document.querySelectorAll("h2~span"));
// . は style の class
console.log("p.hoge:");
console.log(document.querySelectorAll("p.hoge"));
console.log(".hoge:");
console.log(document.querySelectorAll(".hoge"));
// + は + の前に記載した要素の直後の要素
console.log("span+.hoge:");
console.log(document.querySelectorAll("span+.hoge"));
