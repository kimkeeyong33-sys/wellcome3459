// 브라우저에서 알림 권한을 요청하고, 서비스워커에 푸시 구독을 등록합니다.
// 알라미 앱이 OS 알림을 쓰는 것처럼, 이 웹앱은 Web Push API로
// 카카오톡 같은 중간 채널 없이 기기에 직접 알림을 보냅니다.

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type SubscribeResult =
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "subscribed"; subscription: PushSubscriptionJSON };

export async function subscribeToPush(): Promise<SubscribeResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    // VAPID 키 미설정(로컬 데모) — 권한만 받아둔 상태로 처리
    return { status: "subscribed", subscription: {} as PushSubscriptionJSON };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }));

  return { status: "subscribed", subscription: subscription.toJSON() };
}
