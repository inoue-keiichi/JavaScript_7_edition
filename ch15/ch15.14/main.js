/*
 * このクラスは、キャンバスや画像の矩形を表す。Tileを使って、キャンバスを領域に
 * 分割して、ワーカーが独立して処理できるようにする。
 * Tileオブジェクトのプロパティは、大きな矩形の中でのTileの位置とサイズを表す。
 */
class Tile {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // この静的メソッドは、指定された幅と高さの矩形を、指定された数の行と
  // 列に分割し、その矩形を覆うように、numRows*numCols個のTileオブジェクトを
  // 生成するジェネレータ。
  static *tiles(width, height, numRows, numCols) {
    const columnWidth = Math.ceil(width / numCols);
    const rowHeight = Math.ceil(height / numRows);

    for (let row = 0; row < numRows; row++) {
      let tileHeight =
        row < numRows - 1
          ? rowHeight // 行の高さ。
          : height - rowHeight * (numRows - 1); // 最後の行の高さ。
      for (let col = 0; col < numCols; col++) {
        let tileWidth =
          col < numCols - 1
            ? columnWidth // 列の幅。
            : width - columnWidth * (numCols - 1); // 最後の列の幅。

        yield new Tile(
          col * columnWidth,
          row * rowHeight,
          tileWidth,
          tileHeight
        );
      }
    }
  }
}

/*
 * このクラスは、同じコードを実行するワーカーのプールを表す。指定した
 * ワーカーコードは、受信した各メッセージに応答して、何らかの計算を行い、
 * その計算結果を1つのメッセージとして送信する。
 *
 * WokerPoolと実行する作業を表すメッセージがあれば、メッセージを引数
 * としてaddWork()を呼び出すだけ。現在アイドル状態のWorkerオブジェクトが
 * あれば、メッセージはすぐにそのワーカーに送信される。アイドル状態の
 * Wokerが存在しない場合、メッセージはキューに入れられ、ワーカーが利用
 * 可能になったときに送信される。
 *
 * addWork()はPromiseを返す。このPromiseはワーカーから受け取ったメッセージで
 * 解決する。または、ワーカーが未処理のエラーをスローした場合は失敗する。
 */
class WorkerPool {
  constructor(numWorkers, workerSource) {
    this.idleWorkers = []; // 現在処理を行っていないワーカー。
    this.workQueue = []; // 現在処理されていない仕事。
    this.workerMap = new Map(); // ワーカーと解決、失敗時の関数をマッピングする。

    // 指定した数のワーカーを作成し、メッセージハンドラとエラーハンドラを
    // 追加し、idleWorkers配列に保存する。
    for (let i = 0; i < numWorkers; i++) {
      const worker = this._newWorkerViaBlob(workerSource);
      worker.onmessage = (message) => {
        this._workerDone(worker, null, message.data);
      };
      worker.onerror = (error) => {
        this._workerDone(worker, error, null);
      };
      this.idleWorkers[i] = worker;
    }
  }

  // ローカル環境で Worker の実行ファイルを開こうとするとエラーになる
  // https://tshino.hatenablog.com/entry/20180106/1515218776
  _newWorkerViaBlob(relativePath) {
    const baseURL = window.location.href
      .replace(/\\/g, "/")
      .replace(/\/[^\/]*$/, "/");
    const array = ['importScripts("' + baseURL + relativePath + '");'];
    const blob = new Blob(array, { type: "text/javascript" });
    const url = window.URL.createObjectURL(blob);
    return new Worker(url);
  }

  // この内部メソッドは、ワーカーがメッセージを送信したり、エラーを
  // スローしたりして、処理を終了したときに呼び出される。
  _workerDone(worker, error, response) {
    // このWorkerのresolve()とreject()関数を検索し、
    // マップからこのワーカーのエントリを削除する。
    let [resolver, rejector] = this.workerMap.get(worker);
    this.workerMap.delete(worker);

    // キューに入っている仕事がなければ、このワーカーをアイドル状態の
    // ワーカーリストに戻す。キューに入っている仕事があれば、キューから
    // 仕事を取り出し、このワーカーに送信する。
    if (this.workQueue.length === 0) {
      this.idleWorkers.push(worker);
    } else {
      let [work, resolver, rejector] = this.workQueue.shift();
      this.workerMap.set(worker, [resolver, rejector]);
      worker.postMessage(work);
    }

    // 最後に、ワーカーに関連するPromiseを解決させるか、失敗させる。
    error === null ? resolver(response) : rejector(error);
  }

  // このメソッドは、ワーカープールに仕事を追加し、Promiseを返す。
  // このPromiseは、仕事が完了したときに、ワーカーの応答で解決する。
  // 仕事は、postMessage()を使ってワーカーに渡される。アイドル状態の
  // ワーカーがあれば、仕事のメッセージはすぐに送信される。ない場合は、
  // ワーカーが利用可能になるまで仕事はキューに入れられる。
  addWork(work) {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        let worker = this.idleWorkers.pop();
        this.workerMap.set(worker, [resolve, reject]);
        worker.postMessage(work);
      } else {
        this.workQueue.push([work, resolve, reject]);
      }
    });
  }
}

/*
 * このクラスは、マンデルブロ集合を描画するのに必要な状態情報を保持する。
 * cxとcyプロパティは、画像の中心となる複素平面上の点を示す。perPixel
 * プロパティには、複素数の実数部と虚数部が画像のピクセルごとにどれだけ
 * 変化するかを指定する。maxIterationsプロパティには、集合を計算する
 * ためにどれだけ処理を行うかを指定する。数値が大きいほど計算量は多く
 * なるが、くっきりとした画像が得られる。なお、キャンバスの大きさは
 * 状態に含まれないことに注意。cx、cy、perPixelが与えられると、
 * マンデルブロ集合のうち現在のキャンバスのサイズに収まる部分を単純に
 * 描画する。
 *
 * このクラスのオブジェクトは、history.pushState()で使われる。
 * このオブジェクトを使って、ブックマークされたURLやシェアされたURLから
 * 必要な状態を読み取る。
 */
class PageState {
  // このファクトリメソッドは、全体を表示するために初期状態を返す。
  static initialState() {
    let s = new PageState();
    s.cx = -0.5;
    s.cy = 0;
    s.perPixel = 3 / window.innerHeight;
    s.maxIterations = 500;
    return s;
  }

  // このファクトリメソッドはURLから状態を取得する。URLから有効な状態が
  // 取得できなかった場合は、nullを返す。
  static fromURL(url) {
    let s = new PageState();
    let u = new URL(url); // URLの検索パラメータを使って状態を初期化する。
    s.cx = parseFloat(u.searchParams.get("cx"));
    s.cy = parseFloat(u.searchParams.get("cy"));
    s.perPixel = parseFloat(u.searchParams.get("pp"));
    s.maxIterations = parseInt(u.searchParams.get("it"));
    // 有効な値を取得できた場合はPageSateオブジェクトを返す。そうでない場合はnull。
    return isNaN(s.cx) ||
      isNaN(s.cy) ||
      isNaN(s.perPixel) ||
      isNaN(s.maxIterations)
      ? null
      : s;
  }

  // このインスタンスメソッドは、現在の状態をブラウザの現在のロケーションの
  // 検索パラメータにエンコードする。
  toURL() {
    let u = new URL(window.location);
    u.searchParams.set("cx", this.cx);
    u.searchParams.set("cy", this.cy);
    u.searchParams.set("pp", this.perPixel);
    u.searchParams.set("it", this.maxIterations);
    return u.href;
  }
}

// 以下の定数で、マンデルブロ集合の計算の並行性を制御する。お使いのコンピュータで
// 最適なパフォーマンスを得るには、これらを調整する必要があるかもしれない。
const ROWS = 3,
  COLS = 4,
  NUMWORKERS = globalThis.navigator.hardwareConcurrency || 2;

// これが、マンデルブロ集合プログラムのメインクラス。描画する<canvas>要素を
// 引数にして、このコンストラクタ関数を呼び出すだけ。このプログラムでは、
// <canvas>要素が常にブラウザウィンドウと同じ大きさになるようにスタイル
// 設定されていると想定している。
class MandelbrotCanvas {
  constructor(canvas) {
    // canvasを保存し、コンテキストオブジェクトを取得し、WorkerPoolを初期化する。
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.workerPool = new WorkerPool(NUMWORKERS, "mandelbrotWorker.js");

    // 後で使用するいくつかのプロパティを定義する。
    this.tiles = null; // canvasの中の矩形。
    this.pendingRender = null; // 現在は描画していない。
    this.wantsRerender = false; // 現在描画は要求されていない。
    this.resizeTimer = null; // 頻繁なサイズ変更を防ぐ。
    this.colorTable = null; // 生のデータをピクセル値に変換する。

    // イベントハンドラを設定する。

    this.canvas.addEventListener("pointerdown", (e) => this.handlePointer(e));
    window.addEventListener("keydown", (e) => this.handleKey(e));
    window.addEventListener("resize", (e) => this.handleResize(e));
    window.addEventListener("popstate", (e) => this.setState(e.state, false));

    // URLから状態を初期化するか、初期状態で開始する。
    this.state = PageState.fromURL(window.location) || PageState.initialState();

    // この状態を履歴機構を使って保存する。
    history.replaceState(this.state, "", this.state.toURL());

    // canvasの大きさを設定して、それを覆うtileの配列を取得する。
    this.setSize();

    // そして、マンデルブロ集合をcanvasに描画する。
    this.render();
  }

  // canvasの大きさを設定して、Tileオブジェクトの配列を初期化する。この
  // メソッドは、コンストラクタから呼び出される。また、ブラウザウィンドウの
  // 大きさが変更されたときに、handleResize()メソッドからも呼び出される。
  setSize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.tiles = [...Tile.tiles(this.width, this.height, ROWS, COLS)];
  }

  // この関数は、PageStateに変更を行い、その新しい状態を使って
  // マンデルブロ集合を再描画し、さらにその新しい状態を
  // history.pushState()で保存する。1番目の引数が関数の場合、この関数は
  // 状態オブジェクトを引数にして呼び出される。この関数が、その状態に変更を
  // 加える。第1引数がオブジェクトの場合は、そのオブジェクトのプロパティを
  // 状態オブジェクトにコピーするだけ。省略可能な第2引数がfalseの場合、
  // 新しい状態は保存されない（popstateイベントに応答してsetStateを
  // 呼び出すときにはこのようにする）。
  setState(f, save = true) {
    // 引数が関数の場合、関数を呼び出して状態を更新する。
    // 関数ではない場合、プロパティを現在の状態にコピーする。
    if (typeof f === "function") {
      f(this.state);
    } else {
      for (let property in f) {
        this.state[property] = f[property];
      }
    }

    // いずれの場合も、新しい状態で即座に描画を開始する。
    this.render();

    // 通常は新しい状態を保存する。ただし、第2引数にfalseが指定されて
    // 呼び出された場合は保存しない（例えば、popstateイベントを処理するとき）。
    if (save) {
      history.pushState(this.state, "", this.state.toURL());
    }
  }

  // このメソッドは、PageStateオブジェクトで指定されたマンデルブロ集合の
  // 一部をcanvasに描画する。このメソッドは、コンストラクタや、状態が
  // 変化したときのsetState()や、canvasの大きさが変化したときのresize
  // イベントハンドラから呼び出される。
  render() {
    // ユーザがキーボードやマウスを使って、実行可能な速度よりも速く描画を
    // 要求する場合がある。このような場合、すべての描画をワーカープールに
    // 送信することはない。その代わりに、描画中であれば、新しい描画が必要で
    // あることをメモしておき、現在の描画を完了したときに、複数の中間状態を
    // スキップして現在の状態を描画する。
    if (this.pendingRender) {
      // すでに描画中であれば、後で描画を行うとメモしておき、現時点ではこれ以上何もしない。
      this.wantsRerender = true;
      return;
    }

    // 状態変数を取得して、canvasの左上隅の複素数を計算する。
    const { cx, cy, perPixel, maxIterations } = this.state;
    const x0 = cx - (perPixel * this.width) / 2;
    const y0 = cy - (perPixel * this.height) / 2;

    // ROWS*COLSのTileそれぞれに対して、mandelbrotWorker.jsのコードに
    // 対するメッセージを引数にしてaddWork()を呼び出す。戻り値のPromise
    // オブジェクトを配列に保管する。
    let promises = this.tiles.map((tile) =>
      this.workerPool.addWork({
        tile: tile,
        x0: x0 + tile.x * perPixel,
        y0: y0 + tile.y * perPixel,
        perPixel: perPixel,
        maxIterations: maxIterations,
      })
    );

    // Promise.all()を使って、Promiseの配列からレスポンスの配列を取得
    // する。各レスポンスは、各Tileに対する計算結果。mandelbrotWorker.jsの
    // コードを思い出せば、各レスポンスには、Tileオブジェクト、ピクセル値の代わりに
    // 反復回数を含むImagaDataオブジェクト、また、そのTileの最小および
    // 最大反復回数が含まれている。
    this.pendingRender = Promise.all(promises)
      .then((responses) => {
        // まず、すべてのTileに対する全体の反復回数の最大値と最小値を
        // 求める。この数値は、ピクセルに色を割り当てるために必要になる。
        let min = maxIterations,
          max = 0;
        for (let r of responses) {
          if (r.min < min) min = r.min;
          if (r.max > max) max = r.max;
        }

        // ここで、ワーカーの生の反復回数を、canvasに表示されるピクセルの色に
        // 変換する方法が必要になる。すべてのピクセルの反復回数はminとmaxの
        // 間であることはわかっているので、各反復回数に対する色を事前に計算し、
        // colorTable配列に格納する。

        // 色テーブルが割り当てられていない場合や、大きさが合わなくなった
        // 場合は、新しいものを割り当てる。
        if (!this.colorTable || this.colorTable.length !== maxIterations + 1) {
          this.colorTable = new Uint32Array(maxIterations + 1);
        }

        // 最大値と最小値が与えられたら、色テーブルの適切な値を計算する。
        // 集合内のピクセルは完全に不透明な黒色にする。集合外のピクセルは、
        // 半透明の黒になり、反復回数が多いほど、不透明度が高くなる。
        // 反復回数が最小のピクセルは透明になり、白い背景が透けて見える
        // ようになり、グレースケールの画像となります。
        if (min === max) {
          // すべてのピクセルが同じであれば、
          if (min === maxIterations) {
            // すべてを黒色にする。
            this.colorTable[min] = 0xff000000;
          } else {
            // またはすべて透明にする。
            this.colorTable[min] = 0;
          }
        } else {
          // 最小値と最大値が異なる一般的な場合は、対数スケールを
          // 使って、各反復回数に0～255の不透明度を割り当て、
          // 左シフト演算子を使ってピクセル値に変換する。
          let maxlog = Math.log(1 + max - min);
          for (let i = min; i <= max; i++) {
            this.colorTable[i] =
              Math.ceil((Math.log(1 + i - min) / maxlog) * 255) << 24;
          }
        }

        // ここで、各レスポンスのImageData中の反復回数を
        // colorTableの色に変換する。
        for (let r of responses) {
          let iterations = new Uint32Array(r.imageData.data.buffer);
          for (let i = 0; i < iterations.length; i++) {
            iterations[i] = this.colorTable[iterations[i]];
          }
        }

        // 最後に、putImageData()を使って、すべてのimageDataオブジェクトを、
        // canvasの対応するtileに描画する（ただし、最初に、pointerdown
        // イベントハンドラによって設定されている可能性のあるcanvas上の
        // CSSトランスフォームをすべて削除する）。
        this.canvas.style.transform = "";
        for (let r of responses) {
          this.context.putImageData(r.imageData, r.tile.x, r.tile.y);
        }
      })
      .catch((reason) => {
        // Promiseで何か問題が発生した場合は、ここでエラーを記録する。
        // このコードは実行されないはずだが、万が一何か起きた場合には
        // デバッグに役立つ。
        console.error("Promise rejected in render():", reason);
      })
      .finally(() => {
        // 描画が終わったら、pendingRenderフラグをクリアする。
        this.pendingRender = null;
        // また、描画中に描画リクエストが来ていたら、すぐに描画を行う。
        if (this.wantsRerender) {
          this.wantsRerender = false;
          this.render();
        }
      });
  }

  // ユーザがウィンドウのサイズを変更すると、この関数が繰り返し呼び出される。
  // canvasのサイズを変更して、マンデルブロ集合を再描画するのは、1秒間に
  // 何度も実行できるような処理ではないので、タイマーを使用して、最後に
  // サイズ変更イベントを受信してから200ms経過するまで、サイズ変更の処理を
  // 延期する。
  handleResize(event) {
    // すでにサイズ変更を延期していた場合は、それをクリアする。
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    // 代わりに、このサイズ変更を延期する。
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null; // サイズ変更に対応した。
      this.setSize(); // canvasとtileのサイズを変更する。
      this.render(); // 新しいサイズで再描画する。
    }, 200);
  }

  // ユーザがキーを押下した場合、このイベントハンドラが呼び出される。
  // 押下されたキーに応じてsetState()を呼び出し、setState()は
  // 新しい状態を描画し、URLを更新し、ブラウザ履歴に状態を保存する。
  handleKey(event) {
    switch (event.key) {
      case "Escape": // ESCキーを押下した場合は、初期状態に戻る。
        this.setState(PageState.initialState());
        break;
      case "+": // +を押下した場合は、反復回数を増やす。
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations * 1.5);
        });
        break;
      case "-": // -を押下した場合は、反復回数を減らす。
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations / 1.5);
          if (s.maxIterations < 1) s.maxIterations = 1;
        });
        break;
      case "o": // oを押下した場合は、ズームアウトする。
        this.setState((s) => (s.perPixel *= 2));
        break;
      case "ArrowUp": // 上矢印で上にスクロール。
        this.setState((s) => (s.cy -= (this.height / 10) * s.perPixel));
        break;
      case "ArrowDown": // 下矢印で下にスクロール。
        this.setState((s) => (s.cy += (this.height / 10) * s.perPixel));
        break;
      case "ArrowLeft": // 左矢印で左にスクロール。
        this.setState((s) => (s.cx -= (this.width / 10) * s.perPixel));
        break;
      case "ArrowRight": // 右矢印で右にスクロール。
        this.setState((s) => (s.cx += (this.width / 10) * s.perPixel));
        break;
    }
  }

  // このメソッドは、canvas上でpointerdownイベントが発生したときに
  // 呼び出される。pointerdownイベントは、ズームのジェスチャー
  // （クリックやタップ）や、パンのジェスチャー（ドラッグ）の開始時に
  // 発生する。このハンドラは、ジェスチャーの残りの部分に反応するために、
  // pointermoveとpointerupイベントハンドラを登録する（これら2つの
  // ハンドラは、pointerupでジェスチャーが終了すると削除される）。
  handlePointer(event) {
    // 最初にポインタがダウンしたときのピクセル座標と時間。
    // canvasはウィンドウと同じ大きさなので、このイベント座標は
    // canvas座標でもある。
    const x0 = event.clientX,
      y0 = event.clientY,
      t0 = Date.now();

    // これはmoveイベント用のハンドラ。
    const pointerMoveHandler = (event) => {
      // ポインタがどれだけ動いて、どれだけの時間が経過したのか？
      let dx = event.clientX - x0,
        dy = event.clientY - y0,
        dt = Date.now() - t0;

      // ポインタが十分に移動していたり、十分に時間が経過していたりして、
      // 通常のクリックではないない場合は、CSSを使って表示をパンする
      // （pointerupイベントが発生したときに、実際に描画する）。
      if (dx > 10 || dy > 10 || dt > 500) {
        this.canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    // pointerupイベントのハンドラ。
    const pointerUpHandler = (event) => {
      // ポインタが離れたら、ジェスチャーは終了なので、次のジェスチャー
      // までmoveハンドラとupハンドラを削除する。
      this.canvas.removeEventListener("pointermove", pointerMoveHandler);
      this.canvas.removeEventListener("pointerup", pointerUpHandler);

      // ポインタがどれだけ動いて、どれだけの時間が経過したのか？
      const dx = event.clientX - x0,
        dy = event.clientY - y0,
        dt = Date.now() - t0;
      // 状態オブジェクトを個々の定数に展開する。
      const { cx, cy, perPixel } = this.state;

      // ポインタが十分な距離を移動した場合、十分な時間が経過した場合、
      // これはパンのジェスチャー。中心点を変更するために、状態を変更する”
      // 必要がある。それ以外の場合は、ユーザがあるポイントをクリックまたは
      // タップしたので、そのポイントを中心にしてズームインする必要がある。
      if (dx > 10 || dy > 10 || dt > 500) {
        // ユーザが画像を(dx, dy)ピクセルだけパンした。
        // これらの値を複素平面上のオフセットに変換する。
        this.setState({ cx: cx - dx * perPixel, cy: cy - dy * perPixel });
      } else {
        // ユーザがクリックした。中心点が何ピクセル移動したかを計算する。
        let cdx = x0 - this.width / 2;
        let cdy = y0 - this.height / 2;

        // CSSを使って素早く一時的にズームインする。
        this.canvas.style.transform = `translate(${-cdx * 2}px, ${
          -cdy * 2
        }px) scale(2)`;

        // 新しい中心点の複素数座標を設定し、2倍にズームインする。
        this.setState((s) => {
          s.cx += cdx * s.perPixel;
          s.cy += cdy * s.perPixel;
          s.perPixel /= 2;
        });
      }
    };

    // ユーザがジェスチャーを開始すると、それに続くpointermoveと
    // pointerupイベントのハンドラを登録する。
    this.canvas.addEventListener("pointermove", pointerMoveHandler);
    this.canvas.addEventListener("pointerup", pointerUpHandler);
  }
}

// 最後に、canvasを設定する。なお、このJavaScriptファイルは自己完結している。
// HTMLファイルには、<script>タグだけを記述すればよい。
let canvas = document.createElement("canvas"); // canvas要素を作成する。
document.body.append(canvas); // ボディに挿入する。
document.body.style = "margin:0"; // ボディのマージンをゼロに。
canvas.style.width = "100%"; // canvasの幅をボディと同じにする。
canvas.style.height = "100%"; // 高さもボディと同じにする。
new MandelbrotCanvas(canvas); // そして、描画を開始する。
