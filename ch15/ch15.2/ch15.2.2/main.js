// onload は一つのみ登録できる。複数登録しようとすると古いものは上書きされる
// addEventListener は複数登録できる
window.onload = function () {
  const form = document.querySelector("form#submit");
  form.onsubmit = function (event) {
    window.alert("テストです3");
    event.preventDefault();
  };

  form.onsubmit = function (event) {
    window.alert("テストです4");
    event.preventDefault();
  };
};

const form = document.getElementById("submit");
form.addEventListener("submit", () => {
  window.alert("テストです1");
});

form.addEventListener("submit", () => {
  window.alert("テストです2");
});
