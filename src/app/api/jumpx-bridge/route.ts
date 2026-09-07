import { NextRequest, NextResponse } from "next/server";

// 매물 상세("JUMP X에서 입찰 참여하기")에서 눌렀을 때, JUMP X의 인증 브릿지
// (bridge-issue-ticket Edge Function)를 서버 간(공유 비밀키) 호출로 트리거하고,
// JUMP X의 /auth/bridge 진입점으로 이동할 URL을 돌려주는 경량 엔드포인트입니다.
//
// 배경: 덤핑점핑과 JUMP X는 완전히 별개의 Supabase 프로젝트(다른 조직)라 로그인
// 세션을 직접 공유할 방법이 없습니다. 그래서 완전 자동 로그인 대신, 전화번호만
// 미리 채워서 JUMP X 쪽에서 실제 SMS 인증(OTP)을 한 번 더 거치게 하는 절충안을
// 씁니다 — 이 엔드포인트는 그 "티켓 발급" 요청만 대신 해줄 뿐, 실제 인증은 JUMP X
// 쪽 /auth/bridge 페이지에서 이루어집니다. 여기서 넘기는 전화번호가 가입 시
// 자체 입력값(OTP 등으로 검증 안 됨)이어도 안전한 이유: 이 티켓은 "번호 입력
// 단계만 건너뛰게" 해줄 뿐이고, 그 번호로 실제 인증번호가 발송되어 본인이 그
// 문자를 받아 입력해야만 로그인이 완료되기 때문입니다.
//
// 필요한 서버 전용 환경변수 (.env.local, .env.local.example 참고):
//   JUMPX_BRIDGE_URL = JUMP X 프로젝트의 bridge-issue-ticket Edge Function 전체 URL
//   JUMPX_BRIDGE_SHARED_SECRET = JUMP X 프로젝트의 BRIDGE_SHARED_SECRET과 동일한 값
//   JUMPX_ORIGIN = JUMP X 사이트 주소 (기본값: https://jumpx.co.kr)
export async function POST(req: NextRequest) {
  const { phone, redirectPath } = await req.json();

  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  if (!/^01[0-9]{7,9}$/.test(digits)) {
    return NextResponse.json({ error: "휴대폰 번호를 확인해주세요." }, { status: 400 });
  }

  const bridgeUrl = process.env.JUMPX_BRIDGE_URL;
  const sharedSecret = process.env.JUMPX_BRIDGE_SHARED_SECRET;
  if (!bridgeUrl || !sharedSecret) {
    return NextResponse.json({ error: "JUMP X 연동이 아직 설정되지 않았습니다." }, { status: 500 });
  }

  // redirectPath는 JUMP X 쪽 상대경로만 허용합니다(open redirect 방지) — JUMP X의
  // bridge-issue-ticket도 같은 검사를 하지만, 여기서도 미리 한 번 걸러둡니다.
  const safeRedirectPath =
    typeof redirectPath === "string" && redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : undefined;

  let ticketRes: Response;
  try {
    ticketRes = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-secret": sharedSecret },
      body: JSON.stringify({ phone: digits, redirect_path: safeRedirectPath }),
    });
  } catch {
    return NextResponse.json(
      { error: "JUMP X에 연결하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const ticketBody = await ticketRes.json().catch(() => null);
  if (!ticketRes.ok || !ticketBody?.code) {
    return NextResponse.json(
      { error: ticketBody?.error ?? "JUMP X에 연결하지 못했어요." },
      { status: 502 }
    );
  }

  const jumpxOrigin = process.env.JUMPX_ORIGIN ?? "https://jumpx.co.kr";
  const redirectUrl = `${jumpxOrigin}/auth/bridge?code=${encodeURIComponent(ticketBody.code)}`;

  return NextResponse.json({ url: redirectUrl });
}
