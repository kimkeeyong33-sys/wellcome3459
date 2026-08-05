// 티켓 코드: 헷갈리는 글자(0/O, 1/I/L 등)를 뺀 6자리 대문자+숫자 조합.
// 매장 직원이 손으로 입력해도 실수가 적도록 설계했습니다.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateTicketCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function ticketUrl(code: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base}/t/${code}`;
}
