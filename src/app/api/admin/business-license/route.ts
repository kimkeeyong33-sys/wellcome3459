import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "business-licenses";
const SIGNED_URL_TTL_SECONDS = 120;

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );
}

// 사업자등록증 열람 — 요청할 때마다 만료 시간이 짧은 서명 URL을 새로 발급합니다(공개 URL 없음).
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId가 필요합니다." }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase가 연결돼 있지 않아요." }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select("business_license_path")
    .eq("id", memberId)
    .single();
  if (error || !member?.business_license_path) {
    return NextResponse.json({ error: "첨부된 사업자등록증이 없어요." }, { status: 404 });
  }

  const { data, error: signError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(member.business_license_path, SIGNED_URL_TTL_SECONDS);
  if (signError || !data) {
    return NextResponse.json({ error: "열람 링크 생성에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}

// 사업자등록증 확인 후 인증 완료 처리
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });

  const { memberId } = await req.json();
  if (!memberId) return NextResponse.json({ error: "memberId가 필요합니다." }, { status: 400 });

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("members")
    .update({ business_verified: true })
    .eq("id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
