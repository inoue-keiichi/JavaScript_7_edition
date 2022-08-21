// これはサーバサイドJavaScript。Nodeで実行する。
// 単純で完全に匿名のチャットルーム。
// 新しいメッセージを/chatにPOSTする。同じURLからtext/event-streamの
// メッセージを取得する。/へのGETリクエストは、クライアントサイドの
// チャットURIが含まれた単純なHTMLファイルを返す。
const http = require("http");
const fs = require("fs");
const url = require("url");
const { url } = require("inspector");

const clientHTML = fs.readFileSync("chatClient.html");

// イベントを送信するServerResponseオブジェクトの配列。
const clients = [];

const server = new http.Server();
server.listen(8080);

// サーバが新しいリクエストを受け取ると、この関数が実行される。
server.on("request", (request, response) => {
  const pathname = new URL(request.url).pathname;

  if (pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html" }).end(clientHTML);
  } else if (pathname === "/chat" && request.method === "GET") {
    acceptNewClient(request, response);
  } else if (pathname === "/chat" && request.method === "POST") {
    broadcastNewMessage(request, response);
  } else {
    response.writeHead(404).end();
  }
});

// /chatエンドポイントへのGETのリクエストを処理する。このリクエストは、
// クライアントが新しいEventSourceオブジェクトを生成したとき（または
// EventSourceが自動的に再接続されたとき）に送信される。
function acceptNewClient(request, response) {
  // レスポンスオブジェクトを記憶して、今後メッセージを送れるようにする。
  clients.push(response);

  // クライアントが接続を終了した場合は、対応するレスポンスオブジェクトを
  // アクティブなクライアントの配列から削除する。
  request.connection.on("end", () => {
    clients.splice(clients.indexOf(response), 1);
    response.end();
  });

  // ヘッダを設定し、このクライアントだけに最初のチャットイベントを送信する。
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
  response.write("event: chat\ndata: Connected\n\n");
}

// この関数は、ユーザが新しいメッセージを入力したときに、/chatエンド
// ポイントへのPOSTリクエストに対して呼び出される。
async function broadcastNewMessage(request, response) {
  // まず、ユーザのメッセージを取得するためにリクエストのボディを読み出す。
  request.setEncoding("utf8");
  let body = "";
  for await (let chunk of request) {
    body += chunk;
  }

  // ボディを読み込んだら、空のレスポンスを送信し、接続を閉じる。
  response.writeHead(200).end();

  // メッセージをtext/event-stream形式で作成し、各行の先頭に
  // 「data: 」を付与する。
  let message = "data: " + body.replace("\n", "\ndata: ");

  // メッセージデータに「chat」イベントであることを示す接頭辞と、
  // イベントの終了を示すために改行を2度付与する。
  let event = `event: chat\n${message}\n\n`;

  // 待ち受け中のすべてのクライアントにこのイベントを送信する。
  clients.forEach((client) => client.write(event));
}
