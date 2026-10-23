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
 * Register the Service Worker and subscribe to push notifications.
 * Called explicitly from a settings screen button.
 * The browser permission dialog is also shown here.
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

        // Reuse the existing subscription if present (prevents duplicate registration)
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
// Unsubscribe (called from the settings screen and on logout)
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
// Auto-run (only syncs the existing subscription with the backend on logged-in pages)
// =============================

async function syncExistingSubscription() {
    if (!("serviceWorker" in navigator)) return;
    if (Notification.permission !== "granted") return;

    try {
        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            // Re-register if the server-side record has been deleted
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
