import { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6시간
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret";

type AdminPayload = { id: string; name: string; role: string; exp: number };

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function signAdminToken(admin: { id: string; name: string; role: string }) {
  const payload: AdminPayload = { ...admin, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifyAdminToken(token: string): AdminPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig || sign(body) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AdminPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 5 * 60 * 1000;

export function checkLoginRateLimit(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const entry = attempts.get(ip);
  if (entry && entry.blockedUntil > Date.now()) {
    return { ok: false as const, status: 429, error: "잠시 후 다시 시도해주세요." };
  }
  return { ok: true as const };
}

export function recordLoginFailure(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const entry = attempts.get(ip) ?? { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_MS;
    entry.count = 0;
  }
  attempts.set(ip, entry);
}

export function clearLoginFailures(req: NextRequest) {
  attempts.delete(req.headers.get("x-forwarded-for") ?? "unknown");
}

export function checkAdminAuth(
  req: NextRequest
):
  | { ok: true; admin: { id: string; name: string; role: string } }
  | { ok: false; status: number; error: string } {
  const token = req.headers.get("x-admin-key");
  if (!token) return { ok: false, status: 401, error: "인증 실패" };
  const payload = verifyAdminToken(token);
  if (!payload) return { ok: false, status: 401, error: "인증 실패 또는 세션 만료" };
  return { ok: true, admin: { id: payload.id, name: payload.name, role: payload.role } };
}
