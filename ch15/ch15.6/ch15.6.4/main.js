import SearchBox from "./searchBox.js";

// この静的なフィールドは、attributeChangedCallbackメソッドで必要になる。
// この配列に含まれる名前の属性のものだけが、メソッド呼び出しのきっかけになる。
SearchBox.observedAttributes = ["disabled", "placeholder", "size", "value"];

// <template>要素を作成する。この要素は、スタイルシートと要素のツリーを
// 保持する。SearchBox要素のインスタンスで利用する。
SearchBox.template = document.createElement("template");

// このHTML文字列を解釈してテンプレートを初期化する。しかし、SearchBoxの
// インスタンスを作成するときには、テンプレートのノードを複製するだけ。
// HTMLを再度解釈する必要はない。
SearchBox.template.innerHTML = `
<style>
  @import './style.css';
</style>
<div>
  <slot name="left">\u{1f50d}</slot>  <!-- U+1F50Dは虫眼鏡。 -->
  <input type="text" id="input" />    <!-- 実際の入力要素。 -->
  <slot name="right">\u{2573}</slot>  <!-- U+2573はX。 -->
</div>
`;

// 最後に、customElement.define()を呼び出して、SearchBox要素を<search-box>タグの
// 実装として登録する。カスタム要素のタグ名にはハイフンが含まれていなければならない。
customElements.define("search-box", SearchBox);
