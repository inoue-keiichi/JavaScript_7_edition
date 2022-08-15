class InlineCircle extends HTMLElement {
  connectedCallback() {
    // 円の作成に必要なスタイルを設定する。
    this.style.display = "inline-block";
    this.style.borderRadius = "50%";
    this.style.border = "solid black 1px";
    this.style.transform = "translateY(10%)";

    // 大きさがまだ設定されていない場合、現在のフォントサイズを基に
    // デフォルトの大きさを設定する。
    if (!this.style.width) {
      this.style.width = "0.8em";
      this.style.height = "0.8em";
    }
  }

  // 静的なobservedAttributesプロパティで、値が変化したときに
  // 通知してほしい属性を指定する（ここではゲッターを使っている。
  // 「static」はメソッドにしか使えないため）。
  static get observedAttributes() {
    return ["diameter", "color"];
  }

  // カスタム要素が初めて解釈されるときや、その後解釈されたときに、
  // 前記した属性のいずれかが変化すると、このコールバックが呼び出される。
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "diameter":
        // diameter属性が変更された場合、大きさを更新する。
        this.style.width = newValue;
        this.style.height = newValue;
        break;
      case "color":
        // color属性が変更された場合、色を変更する。
        this.style.backgroundColor = newValue;
        break;
    }
  }

  // 要素の属性に対応するJavaScriptプロパティを定義する。ここで
  // 定義したゲッターとセッターは、属性を読み出したり設定したり
  // するだけ。JavaScriptのプロパティが設定されると、属性が設定
  // される。そして、attributeChangedCallback()が呼び出され、
  // 要素のスタイルが更新される。
  get diameter() {
    return this.getAttribute("diameter");
  }
  set diameter(diameter) {
    this.setAttribute("diameter", diameter);
  }
  get color() {
    return this.getAttribute("color");
  }
  set color(color) {
    this.setAttribute("color", color);
  }
}

export default InlineCircle;
