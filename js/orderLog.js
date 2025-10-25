// orderLog.js
import { allOrders } from './orderManagement.js'; // export しておく場合

function updateLog() {
    // 未提供・提供済み含め、集計
    let totalPrice = 0;
    let totalPiece = 0;

    allOrders.forEach(order => {
        totalPiece += order.NumberOfPieces;
        totalPrice += (order.NumberOfPieces * (order.Price || 0)); // Price フィールドがあれば
    });

    document.getElementById("totalPrice").textContent = totalPrice;
    document.getElementById("totalPiece").textContent = totalPiece;
}

// ページ読み込み時に更新
updateLog();

// リアルタイム反映させたい場合は orderManagement.js の onSnapshot 内で呼ぶ
