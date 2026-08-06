// 고객용 "모아보기" 저장 목록 — 로그인 없이 이 기기(브라우저)에 저장된 티켓 코드 목록입니다.
const WALLET_KEY = "cashticket_wallet_codes";

export function getWalletCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addToWallet(code: string) {
  if (typeof window === "undefined") return;
  const codes = getWalletCodes();
  if (!codes.includes(code)) {
    window.localStorage.setItem(WALLET_KEY, JSON.stringify([code, ...codes]));
  }
}

export function removeFromWallet(code: string) {
  if (typeof window === "undefined") return;
  const codes = getWalletCodes().filter((c) => c !== code);
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(codes));
}

export function isInWallet(code: string): boolean {
  return getWalletCodes().includes(code);
}

// 사장님 로그인 세션 — 별도 서버 세션 없이, 발급받은 매장 id를 이 기기에 보관합니다.
// (관리자 페이지의 ADMIN_PASSWORD와 같은 수준의 단순한 경량 보호이며,
//  실제 서비스 전환 시 정식 인증으로 교체가 필요합니다.)
const OWNER_KEY = "cashticket_owner_session";

export type OwnerSession = {
  storeId: string;
  storeName: string;
  ownerName: string;
  businessVerified?: boolean;
};

export function getOwnerSession(): OwnerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OWNER_KEY);
    return raw ? (JSON.parse(raw) as OwnerSession) : null;
  } catch {
    return null;
  }
}

export function setOwnerSession(session: OwnerSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_KEY, JSON.stringify(session));
}

export function clearOwnerSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OWNER_KEY);
}
