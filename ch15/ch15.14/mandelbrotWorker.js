// これは、親スレッドからメッセージを受け取り、そのメッセージに
// 記述されている計算を実行し、その計算結果を親スレッドに
// 送信するシンプルなワーカー。
onmessage = function (message) {
  // まず、受け取ったメッセージを展開する。
  //  - tileは、widthとheightというプロパティを持つオブジェクト。
  //    マンデルブロ集合を計算するための矩形サイズ（ピクセル単位）を
  //    指定する。
  //  - (x0, y0)は、tileの複素平面上の左上のピクセルに対応する。
  //  - perPixelは、実数次元と虚数次元の両方におけるピクセルサイズ。
  //  - maxIterationsには、あるピクセルが集合に含まれると判断する
  //    までに実行する反復の最大値を指定する。
  const { tile, x0, y0, perPixel, maxIterations } = message.data;
  const { width, height } = tile;

  // 次に、ピクセルの矩形配列を表すImageDataオブジェクトを作成し、
  // 内部のArrayBufferを取得し、そのバッファに対して型付き配列の
  // ビューを作成する。このようにすることで、各ピクセルを4バイト
  // ではなく、1つの整数として扱うことができる。
  // 各ピクセルの反復回数を格納する（この反復回数は、親スレッドで
  // 実際の色に変換される）。
  const imageData = new ImageData(width, height);
  const iterations = new Uint32Array(imageData.data.buffer);

  // これから計算を開始する。この計算には、入れ子になった3つのループがある。
  // 外側の2つのループは、ピクセルの行と列をループする。内側のループは、
  // 各ピクセルが「脱出」するかどうかを調べるために反復する。各ループの
  // 変数は以下の通り。
  // - rowとcolumnは、ピクセル座標を表す整数。
  // - xとyは、各ピクセルの複素点を表す: x + yi。
  // - indexは、現在のピクセルの反復配列におけるインデックス。
  // - maxとminは、矩形内の任意のピクセルについて、これまでの反復回数の
  //   最大値と最小値を記憶する。
  let index = 0,
    max = 0,
    min = maxIterations;
  for (let row = 0, y = y0; row < height; row++, y += perPixel) {
    for (let column = 0, x = x0; column < width; column++, x += perPixel) {
      // 各ピクセルについて、まず複素数c = x+yiを求める。
      // そして、次の再帰式に基づいて、複素数z(n+1)を繰り返し
      // 計算する:
      //    z(0) = c
      //    z(n+1) = z(n)^2 + c
      // もし|z(n)|（z(n)の大きさ）が2より大きければ、そのピクセルは
      // 集合には含まれないので、n回の反復で停止する。
      let n; // これまでの反復回数。
      let r = x,
        i = y; // z(0)をcに設定して開始する。
      for (n = 0; n < maxIterations; n++) {
        let rr = r * r,
          ii = i * i; // z(n)の2つの部分を自乗する。
        if (rr + ii > 4) {
          // |z(n)|^2が4より大きければ、
          break; // 脱出したので、反復を停止する。
        }
        i = 2 * r * i + y; // z(n+1)の虚数部を計算する。
        r = rr - ii + x; // そしてz(n+1)の実数部を計算する。
      }
      iterations[index++] = n; // 各ピクセルに対して反復回数を記憶する。
      if (n > max) max = n; // これまでの最大値を記録する。
      if (n < min) min = n; // そして、最小値も記録する。
    }
  }

  // 計算が完了したら、その結果を親スレッドに送り返す。imageData
  // オブジェクトはコピーされるが、このオブジェクトに含まれる巨大な
  // ArrayBufferは転送されるだけなので、パフォーマンスが向上する。
  postMessage({ tile, imageData, min, max }, [imageData.data.buffer]);
};
