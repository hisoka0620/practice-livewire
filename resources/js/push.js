import base64ToUint8Array from "./utils/base64ToUint8Array";

// =============================
// Helpers
// =============================

function getCsrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") || ""
    );
}

function getVapidPublicKey() {
    return (
        document
            .querySelector('meta[name="vapid-public-key"]')
            ?.getAttribute("content") || null
    );
}

async function sendSubscriptionToBackend(subscription) {
    const res = await fetch("/push/subscriptions", {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: JSON.stringify(subscription),
    });
    if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
}

async function deleteSubscriptionFromBackend(endpoint) {
    const res = await fetch("/push/subscriptions", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) throw new Error(`Unsubscribe failed: ${res.status}`);
}

// =============================
// Subscribe
// =============================

/**
 * Service Worker を登録し、プッシュ通知を購読する。
 * 設定画面のボタンから明示的に呼ぶ想定。
 * ブラウザの許可ダイアログもここで出る。
 */
export async function subscribePush() {
    if (!("serviceWorker" in navigator)) return;

    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) return;

    try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        await navigator.serviceWorker.ready;

        if (Notification.permission === "denied") return;

        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
        }

        // 既存サブスクリプションがあればそのまま使う（重複登録防止）
        const existingSubscription =
            await registration.pushManager.getSubscription();
        if (existingSubscription) {
            await sendSubscriptionToBackend(existingSubscription);
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64ToUint8Array(vapidPublicKey),
        });

        await sendSubscriptionToBackend(subscription);
    } catch (err) {
        console.error("Push subscription failed:", err);
        throw err;
    }
}

// =============================
// Unsubscribe（設定画面・ログアウト時に呼ぶ）
// =============================

export async function unsubscribePush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) return;

        await deleteSubscriptionFromBackend(subscription.endpoint);
        await subscription.unsubscribe();
    } catch (err) {
        console.error("Push unsubscribe failed:", err);
        throw err;
    }
}

// =============================
// Auto-run（ログイン済みページで既存購読をバックエンドと同期するだけ）
// =============================

async function syncExistingSubscription() {
    if (!("serviceWorker" in navigator)) return;
    if (Notification.permission !== "granted") return;

    try {
        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            // サーバー側でレコードが消えていた場合の再登録
            await sendSubscriptionToBackend(subscription);
        }
    } catch (err) {
        console.error("Push sync failed:", err);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncExistingSubscription);
} else {
    syncExistingSubscription();
}
