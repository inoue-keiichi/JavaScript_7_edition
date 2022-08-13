const btn = document.getElementById("btn");
btn.addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("busy", { detail: true }));

  const startMsec = new Date();
  while (new Date() - startMsec < 3000) {
    // 5sec 遅延させる
  }

  document.dispatchEvent(new CustomEvent("busy", { detail: false }));
});

document.addEventListener("busy", (e) => {
  const msg = document.getElementById("msg");
  const wait = document.getElementById("wait");
  if (e.detail) {
    console.log("処理中...");
  } else {
    console.log("OK!");
  }
});
