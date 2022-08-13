document.addEventListener("DOMContentLoaded", () => {
  // 目次を格納する要素を検索する。
  // もしなければ、ドキュメントの先頭に作成する。
  let toc = document.querySelector("#TOC");
  if (!toc) {
    toc = document.createElement("div");
    toc.id = "TOC";
    document.body.prepend(toc);
  }

  // すべての節見出し要素を検索する。このスクリプトでは、<h1>は
  // ドキュメントのタイトルのために使われ、<h2>から<h6>までが
  // ドキュメント中の章のために使われると想定している。
  let headings = document.querySelectorAll("h2,h3,h4,h5,h6");

  // 章番号を記憶する配列を初期化する。
  let sectionNumbers = [0, 0, 0, 0, 0];

  // 発見した節見出し要素を巡回する。
  for (let heading of headings) {
    // TOCコンテナ中の節見出しはスキップする。
    if (heading.parentNode === toc) {
      continue;
    }

    // 見出しのレベルを取得する。
    // <h2>がレベル1見出しになるので、1を減算する。
    let level = parseInt(heading.tagName.charAt(1)) - 1;

    // この見出しレベルの章番号をインクリメントする。
    // また、このレベルより下のレベルの章番号を0に初期化する。
    sectionNumbers[level - 1]++;
    for (let i = level; i < sectionNumbers.length; i++) {
      sectionNumbers[i] = 0;
    }
    // ここで、すべてのレベルの章番号を組み合わせて
    // 2.3.1 のような章番号を生成する。
    let sectionNumber = sectionNumbers.slice(0, level).join(".");

    // 章番号を節見出しに追加する。
    // 章番号を<span>で囲み、スタイルを設定できるようにする。
    let span = document.createElement("span");
    span.className = "TOCSectNum";
    span.textContent = sectionNumber;
    heading.prepend(span);

    // 見出しを名前付きアンカーで囲み、リンクできるようにする。
    let anchor = document.createElement("a");
    let fragmentName = `TOC${sectionNumber}`;
    anchor.name = fragmentName;
    heading.before(anchor); // 見出しの前にアンカーを挿入する。
    anchor.append(heading); // その後、アンカーの中に見出しを移動する。

    // この節へのリンクを作成する。
    let link = document.createElement("a");
    link.href = `#${fragmentName}`; // リンクの飛び先。

    // リンク中に見出しをコピーする。信頼できない文字列は
    // 挿入していないので、安全にinnerHTMLを使用できる。
    link.innerHTML = heading.innerHTML;
    // リンクをdivで囲み、レベルに応じてスタイルを指定できるようにする。
    let entry = document.createElement("div");
    entry.classList.add("TOCEntry", `TOCLevel${level}`);
    entry.append(link);

    // このdivをTOCコンテナに追加する。
    toc.append(entry);
  }
});
