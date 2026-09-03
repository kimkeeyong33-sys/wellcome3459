import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "business-licenses"; // 비공개 버킷 — 공개 URL을 절대 발급하지 않습니다.
const MAX_BYTES = 8 * 1024 * 1024;

// 회원 본인이 사업자등록증 이미지를 첨부합니다. 비공개 버킷에 저장하고
// members.business_license_path만 기록합니다(공개 URL 없음, 조회는 관리자 서명 URL로만).
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const accessToken = formData.get("accessToken") as string | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 첨부할 수 있어요." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "파일 용량이 너무 커요 (최대 8MB)." }, { status: 400 });
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: true, demo: true });
  }
  if (!accessToken) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "인증이 만료됐어요." }, { status: 401 });
  }
  const userId = userData.user.id;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "업로드에 실패했어요." }, { status: 500 });
  }

  // 새로 첨부하면 재검토가 필요하므로 인증 상태를 대기중으로 되돌립니다.
  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({ business_license_path: path, business_verified: false })
    .eq("id", userId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
