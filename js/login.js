

// 管理者のみ操作可能なID
const adminUsers = ["24u029"]; 


const assignBtn = document.getElementById("loginAssign");

assignBtn.addEventListener("click", function () {
  const userId = document.getElementById("userId").value.trim();

  if (userId === "") {
    alert("学籍番号を入力してください");
    return;
  }

  // 形式チェック（任意）
  if (!/^[A-Za-z0-9]{6}$/.test(userId)) {
    alert("学籍番号の形式が正しくありません");
    return;
  }

  // sessionStorageに保存
  sessionStorage.setItem("userId", userId);

  // 次画面へ遷移
  window.location.href = "orderManagement.html";
});
