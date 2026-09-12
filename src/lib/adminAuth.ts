import { NextRequest } from "next/server";

// 서버 인스턴스 메모리 기준 rate limit입니다 — Redis 같은 분산 스토어가 없어서
// 완벽하진 않지만(콜드스타트/여러 인스턴스에서 리셋될 수 있음), 별도 인프라 없이
// 무차별 대입 시도에 최소한의 지연을 강제하는 용도입니다.
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 5 * 60 * 1000; // 5분

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function checkAdminAuth(
  req: NextRequest
): { ok: true } | { ok: false; status: number; error: string } {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return { ok: false, status: 500, error: "관리자 비밀번호가 설정되지 않았습니다." };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.blockedUntil > now) {
    const waitSec = Math.ceil((entry.blockedUntil - now) / 1000);
    return { ok: false, status: 429, error: `너무 많이 틀렸어요. ${waitSec}초 후 다시 시도해주세요.` };
  }

  const key = req.headers.get("x-admin-key") ?? "";
  if (timingSafeEqual(key, password)) {
    attempts.delete(ip);
    return { ok: true };
  }

  const nextCount = (entry?.count ?? 0) + 1;
  attempts.set(ip, {
    count: nextCount,
    blockedUntil: nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : 0,
  });
  return { ok: false, status: 401, error: "인증 실패" };
}
