

// 管理者のみ操作可能なID
const adminUsers = ["24u029"]; 


const loginBtn = document.getElementById("loginAssign");
const userIdInput = document.getElementById("userId");

loginBtn.addEventListener("click", () => {
    const enteredId = userIdInput.value.trim();
    if (!enteredId) {
        alert("学籍番号を入力してください");
        return;
    }

    // sessionStorage に保存
    sessionStorage.setItem("userId", enteredId);
    // 管理者かどうかも保存
    const isAdmin = adminUsers.includes(enteredId);
    sessionStorage.setItem("isAdmin", isAdmin ? "true" : "false");

    // 遷移
    window.location.href = "orderManagement.html";
});
