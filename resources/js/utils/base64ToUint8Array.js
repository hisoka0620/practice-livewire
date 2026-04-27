/** VAPID (URL-safe Base64) → Uint8Array for PushManager */
// usage: registration.pushManager.subscribe({ applicationServerKey: base64ToUint8Array(KEY) })
export default function base64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const rawData = window.atob(base64);

    return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
