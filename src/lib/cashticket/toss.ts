// 토스페이먼츠 결제 승인(confirm) 서버 호출.
// https://api.tosspayments.com/v1/payments/confirm — Basic 인증(시크릿 키 + ":"를 base64).
// TOSS_SECRET_KEY가 없으면 결제 연동 자체가 비활성 상태(데모 모드)이며,
// 이 함수는 그 경우 호출되지 않습니다 (API 라우트에서 분기).

export function isTossConfigured() {
  return Boolean(process.env.TOSS_SECRET_KEY);
}

type ConfirmResult =
  | { ok: true }
  | { ok: false; error: string };

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY as string;
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.message || "결제 승인에 실패했어요." };
  }
  if (data.status !== "DONE") {
    return { ok: false, error: "결제가 아직 완료되지 않았어요." };
  }
  return { ok: true };
}
