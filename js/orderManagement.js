// js/orderManagement.js
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase-init.js";





// ---------------------
// ユーザー確認
// ---------------------
const userId = sessionStorage.getItem("userId");
if (!userId) {
  alert("ログイン情報がありません。ログインページへ移動します。");
  location.href = "login.html";
}
console.log("userId:", userId);

const isAdmin = sessionStorage.getItem("isAdmin") === "true";



// 管理者専用要素
const adminPanel = document.getElementById("adminPanel");
if (adminPanel) {
    if (isAdmin) {
        adminPanel.style.display = "block"; // 表示
    } else {
        adminPanel.style.display = "none";  // 非表示
    }
}



// ---------------------
// 時計表示
// ---------------------
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

// ---------------------
// 数量操作
// ---------------------
const numSpan = document.getElementById("num");
const foodMinus = document.getElementById("foodMinus");
const foodPlus = document.getElementById("foodPlus");
const addOrderFinishBtn = document.getElementById("addOrderFinish");
const addOrderContinueBtn = document.getElementById("addOrderContinue");

function getCurrentNum() { return parseInt(numSpan?.textContent || "0", 10); }
function setCurrentNum(value) { if (numSpan) numSpan.textContent = value; }

foodMinus?.addEventListener("click", () => { let n = getCurrentNum(); if (n > 0) n--; setCurrentNum(n); });
foodPlus?.addEventListener("click", () => { let n = getCurrentNum(); n++; setCurrentNum(n); });

// ---------------------
// モーダル表示/非表示
// ---------------------
function closeAddOrder() {
  const modal = document.getElementById("modalOverlay");
  if (modal) modal.style.display = "none";
}
function appearAddOrder() {
  const modal = document.getElementById("modalOverlay");
  if (modal) modal.style.display = "flex";
}
document.getElementById("createOrderBtn")?.addEventListener("click", appearAddOrder);
document.getElementById("closeOrderInputDiv")?.addEventListener("click", closeAddOrder);

// ---------------------
// 全注文データ保持
// ---------------------
export let allOrders = [];

// ---------------------
// 定数（業務ルール）
// ---------------------
const PRICE_PER_ORDER = 400;  // 1食あたり400円
const COOK_TIME_PER_BATCH = 5; // 5分ごとに調理完了
const MEALS_PER_BATCH = 5;     // 一度に5食作れる

// ---------------------
// 提供予想時間を計算
// ---------------------
function calculateEstimatedTime(pendingCount) {
  if (pendingCount === 0) return "すぐに提供可能";
  const batches = Math.ceil(pendingCount / MEALS_PER_BATCH);
  const totalMinutes = batches * COOK_TIME_PER_BATCH;

  const now = new Date();
  const estimated = new Date(now.getTime() + totalMinutes * 60 * 1000);
  const hh = String(estimated.getHours()).padStart(2, "0");
  const mm = String(estimated.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------------------
// Firestore リアルタイム監視
// ---------------------
// Firestore リアルタイム監視（古い順に並べる）
const q = query(collection(db, "orders"), orderBy("RealTime", "asc"));

onSnapshot(q, (snapshot) => {
  allOrders = snapshot.docs.map(docSnap => ({
    ...docSnap.data(),
    docId: docSnap.id
  }));

  const unserved = allOrders.filter(order => !order.OfferFlag);

  // --- 集計 ---
  const unservedOrders = unserved.length;
  const unservedPieces = unserved.reduce((sum, o) => sum + (o.NumberOfPieces || 0), 0);
  const totalPieces = allOrders.reduce((sum, o) => sum + (o.NumberOfPieces || 0), 0);
  const totalAmount = totalPieces * PRICE_PER_ORDER;

  // --- 画面更新 ---
  updateDisplay(unservedOrders, unservedPieces, totalPieces, totalAmount);
  displayUnservedOrders(unserved);
});

// ---------------------
// 表示更新処理（件数・予想時間）
// ---------------------
function updateDisplay(unservedOrders, unservedPieces, totalPieces, totalAmount) {
  const restCustomerEl = document.getElementById("restCustomer");
  const restFoodEl = document.getElementById("restFood");
  const estimatedClock = document.getElementById("estimatedClock");

  if (restCustomerEl) restCustomerEl.textContent = unservedOrders;
  if (restFoodEl) restFoodEl.textContent = unservedPieces;

  const estTime = calculateEstimatedTime(unservedPieces);
  if (estimatedClock) estimatedClock.textContent = estTime;

  console.log("集計結果:", { unservedOrders, unservedPieces, totalPieces, totalAmount, estTime });
}

// ---------------------
// 未提供オーダー一覧表示（背景色・非表示対応）
// ---------------------
function displayUnservedOrders(unservedOrders) {
  const container = document.getElementById("orderContainer");
  if (!container) return;
  container.innerHTML = "";

  let cumulativeCount = 0;

  unservedOrders.forEach(order => {
    cumulativeCount += order.NumberOfPieces || 0;

    // 注文時間
    const orderTime = order.RealTime?.toDate ? order.RealTime.toDate() : new Date();
    const hh = String(orderTime.getHours()).padStart(2, "0");
    const mm = String(orderTime.getMinutes()).padStart(2, "0");
    const formattedOrderTime = `${hh}:${mm}`;

    // 提供予想時間
    const estimatedTimeStr = calculateEstimatedTime(cumulativeCount);
    const [estH, estM] = estimatedTimeStr.split(":").map(Number);
    const now = new Date();
    const estTime = new Date();
    estTime.setHours(estH, estM, 0, 0);

    // 背景色判定
    let bgColor = "#ffffff";
    const diffMinutes = (now - estTime) / 60000;
    if (diffMinutes >= 10) bgColor = "#ff9999"; // 赤系
    else if (diffMinutes >= 5) bgColor = "#ffcc66"; // オレンジ系
    else if (diffMinutes >= 3) bgColor = "#ffff99"; // 黄色系

    const div = document.createElement("div");
    div.className = "orderItem";
    div.dataset.docId = order.docId;
    div.style.backgroundColor = bgColor;

    div.innerHTML = `
      <h3>${order.OrganizeID}番</h3>
      <p>注文時間: ${formattedOrderTime}</p>
      <p>提供予想: ${estimatedTimeStr}</p>
      <p>個数: ${order.NumberOfPieces}</p>
    `;

    // 提供済みにする
    const provideBtn = document.createElement("button");
    provideBtn.id="provideBtn";
    provideBtn.innerHTML = "提供<br>確認";
    provideBtn.addEventListener("click", async () => {
      try {
        await updateDoc(doc(db, "orders", order.docId), { OfferFlag: true });
      } catch (e) {
        console.error("提供済み更新エラー:", e);
        alert("更新に失敗しました。");
      }
    });
    div.appendChild(provideBtn);

   

    container.appendChild(div);
  });
}

// 自動更新（背景色の段階変化をリアルタイムに反映）
setInterval(() => {
  displayUnservedOrders(allOrders.filter(order => !order.OfferFlag));
}, 60000); // 1分ごと

// ---------------------
// Firestore 注文登録
// ---------------------
export async function addOrder(pieces, callNumber) {
  const estimated = calculateEstimatedTime(allOrders.filter(o => !o.OfferFlag).reduce((sum, o) => sum + o.NumberOfPieces, 0) + pieces);

  const orderId = Math.floor(Math.random() * 1000000);
  const orderData = {
    OrganizeID: callNumber,
    NumberOfPieces: pieces,
    OfferFlag: false,
    OrderID: orderId,
    RealTime: serverTimestamp(),
    ScheduleTime: estimated,
    UserID: userId,
  };

  try {
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return { ...orderData, docId: docRef.id };
  } catch (e) {
    console.error("注文追加エラー:", e);
    alert("注文登録に失敗しました。");
    return null;
  }
}
// ---------------------
// 呼び出し番号上限
// ---------------------
const MAX_CALL_NUMBER = 70;

// ---------------------
// callNumber重複チェック
// ---------------------
function isCallNumberAvailable(callNumber) {
  return !allOrders.some(order => !order.OfferFlag && order.OrganizeID === callNumber);
}

// ---------------------
// 入力中リアルタイムチェック
// ---------------------
const callNumberInput = document.getElementById("callnumber");

// 警告表示用要素を作成
let warningEl = document.createElement("p");
warningEl.id = "callnumberWarning";
warningEl.style.color = "red";
warningEl.style.fontSize = "0.9em";
warningEl.style.margin = "4px 0";
callNumberInput.parentNode.appendChild(warningEl);

callNumberInput.addEventListener("input", () => {
  const value = parseInt(callNumberInput.value, 10);
  if (isNaN(value) || value < 1 || value > MAX_CALL_NUMBER) {
    warningEl.textContent = `1～${MAX_CALL_NUMBER}の数字を入力してください`;
    return;
  }

  if (!isCallNumberAvailable(value)) {
    warningEl.textContent = `${value}番は未提供オーダーで使用中です`;
  } else {
    warningEl.textContent = "";
  }
});

// ---------------------
// 注文登録ボタン処理
// ---------------------
addOrderFinishBtn.addEventListener("click", async () => {
  const pieces = getCurrentNum();
  if (pieces <= 0) { alert("注文数を1以上にしてください"); return; }

  const callNumber = parseInt(callNumberInput.value, 10);
  if (isNaN(callNumber) || callNumber < 1 || callNumber > MAX_CALL_NUMBER) {
    alert(`1～${MAX_CALL_NUMBER}の数字で入力してください`);
    return;
  }

  if (!isCallNumberAvailable(callNumber)) {
    alert(`${callNumber}番は未提供オーダーで使用中です。別の番号を入力してください`);
    return;
  }

  await addOrder(pieces, callNumber);
  setCurrentNum(0);
  closeAddOrder();
});

addOrderContinueBtn.addEventListener("click", async () => {
  const pieces = getCurrentNum();
  if (pieces <= 0) { alert("注文数を1以上にしてください"); return; }

  const callNumber = parseInt(callNumberInput.value, 10);
  if (isNaN(callNumber) || callNumber < 1 || callNumber > MAX_CALL_NUMBER) {
    alert(`1～${MAX_CALL_NUMBER}の数字で入力してください`);
    return;
  }

  if (!isCallNumberAvailable(callNumber)) {
    alert(`${callNumber}番は未提供オーダーで使用中です。別の番号を入力してください`);
    return;
  }

  await addOrder(pieces, callNumber);
  setCurrentNum(0);
});


// ---------------------
// ログ画面遷移
// ---------------------
document.getElementById("showOrderLogBtn")?.addEventListener("click", () => {
  window.location.href = "orderLog.html";
});
