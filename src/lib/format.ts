export function formatWon(value: string | number) {
  return `${Math.round(Number(value)).toLocaleString("ko-KR")}원`;
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRemaining(endAt: string | Date) {
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return "마감";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  SCHEDULED: "예정",
  ACTIVE: "진행중",
  ENDED: "종료",
  CANCELLED: "취소",
};
