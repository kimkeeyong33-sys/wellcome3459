export function formatCountdown(closesAt: string): { label: string; urgent: boolean } {
  const diffMs = new Date(closesAt).getTime() - Date.now();
  if (diffMs <= 0) return { label: "마감", urgent: true };

  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const urgent = diffMs < 1000 * 60 * 60 * 3; // 3시간 미만이면 긴급

  if (days >= 1) {
    return { label: `${days}일 ${hours}:${String(minutes).padStart(2, "0")}`, urgent };
  }
  return {
    label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`,
    urgent,
  };
}

export function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function percentOff(original: number, deal: number) {
  return Math.round(((original - deal) / original) * 100);
}

// 가격 입력창용: 숫자만 남기고 천단위 콤마를 붙여서 보여줍니다.
export function formatPriceInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

// 콤마가 섞인 입력값에서 순수 숫자만 추출합니다 (제출 시 사용).
export function parsePriceInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}
