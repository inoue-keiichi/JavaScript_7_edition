class SearchBox extends HTMLElement {
  constructor() {
    super(); // スーパークラスのコンストラクタを呼び出す。最初に行わなければならない。

    // シャドウDOMツリーを作成し、シャドウDOMをこの要素に接続する。
    // this.shadowRootの値に設定する。
    this.attachShadow({ mode: "open" });

    // このカスタムコンポーネント用の子孫要素やスタイルシートを定義している
    // テンプレートを複製し、コンテンツをシャドウルートに追加する。
    this.shadowRoot.append(SearchBox.template.content.cloneNode(true));

    // シャドウDOM中の重要な要素の参照を取得する。
    this.input = this.shadowRoot.querySelector("#input");
    let leftSlot = this.shadowRoot.querySelector('slot[name="left"]');
    let rightSlot = this.shadowRoot.querySelector('slot[name="right"]');

    // 内部の入力フィールドがフォーカスを得たり失ったりしたときに、
    // 「focused」属性を設定したり削除したりする。内部のスタイルシート
    // により、コンポーネント全体を囲むフォーカスリングを表示したり
    // 隠したりする。なお、「blur」イベントと「focus」イベントは
    // バブリングして、<search-box>から発生したイベントのように見える。
    this.input.onfocus = () => {
      this.setAttribute("focused", "");
    };
    this.input.onblur = () => {
      this.removeAttribute("focused");
    };

    // ユーザが虫眼鏡をクリックした場合、「search」イベントを発生させる。
    // また、入力フィールドが「change」イベントを発生したときも、「search」
    // イベントを発生させる（「change」イベントは、シャドウDOMの外側には
    // バブリングしない。
    leftSlot.onclick = this.input.onchange = (event) => {
      event.stopPropagation(); // clickイベントがバブリングしないようにする。
      if (this.disabled) return; // disabledのときは何もしない。
      this.dispatchEvent(
        new CustomEvent("search", {
          detail: this.input.value,
        })
      );
    };

    // ユーザがXをクリックした場合、「clear」イベントを発生させる。
    // イベントに対してpreventDefault()が呼び出されなかった場合、入力をクリアする。
    rightSlot.onclick = (event) => {
      event.stopPropagation(); // clickイベントがバブリングしないようにする。
      if (this.disabled) return; // disabledの場合何もしない。
      let e = new CustomEvent("clear", { cancelable: true });
      this.dispatchEvent(e);
      if (!e.defaultPrevented) {
        // イベントが「キャンセル」されなかった場合、
        this.input.value = ""; // 入力フィールドをクリアする。
      }
    };
  }

  // 属性が設定されたり変更されたりしたときに、内部の<input>要素の対応する
  // 属性を設定する必要がある。後ほど設定する静的なobservedAttributes
  // プロパティと、このライフサイクルメソッドで処理を行う。
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "disabled") {
      this.input.disabled = newValue !== null;
    } else if (name === "placeholder") {
      this.input.placeholder = newValue;
    } else if (name === "size") {
      this.input.size = newValue;
    } else if (name === "value") {
      this.input.value = newValue;
    }
  }

  // 最後に、サポートするHTML属性に対応したプロパティに対して、ゲッターとセッター
  // を定義する。ゲッターは属性の値（または、属性の有無）を返すだけ。また、
  // セッターは属性の値（または、属性の有無）を設定するだけ。セッターが属性を
  // 変更するときに、ブラウザは自動的に前記したattributeChangedCallbackを
  // 自動的に呼び出す。

  get placeholder() {
    return this.getAttribute("placeholder");
  }
  get size() {
    return this.getAttribute("size");
  }
  get value() {
    return this.getAttribute("value");
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  get hidden() {
    return this.hasAttribute("hidden");
  }

  set placeholder(value) {
    this.setAttribute("placeholder", value);
  }
  set size(value) {
    this.setAttribute("size", value);
  }
  set value(text) {
    this.setAttribute("value", text);
  }
  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }
  set hidden(value) {
    if (value) this.setAttribute("hidden", "");
    else this.removeAttribute("hidden");
  }
}

export default SearchBox;
