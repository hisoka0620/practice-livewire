import base64ToUint8Array from "./utils/base64ToUint8Array";

async function registerServiceWorkerAndSubscribe() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    const vapidKeyMeta = document.querySelector(
        'meta[name="vapid-public-key"]',
    );
    const vapidPublicKey = vapidKeyMeta?.getAttribute("content");
    if (!vapidPublicKey) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // only try to subscribe if permission is default (not granted or denied)
        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
        } else if (Notification.permission === "denied") {
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64ToUint8Array(vapidPublicKey),
        });

        // send subscription to backend
        await fetch("/push/subscribe", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
            body: JSON.stringify(subscription),
        });
    } catch (err) {
        // fail silently for now; could report to logging endpoint
        console.error("Push subscription failed:", err);
    }
}

// Auto-run only when page is loaded and user is authenticated (we rely on .vapid meta existence)
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        registerServiceWorkerAndSubscribe,
    );
} else {
    registerServiceWorkerAndSubscribe();
}
