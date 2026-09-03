import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 내가 추천해서 가입한 회원 목록 — 본인 access token으로 신원을 검증한 뒤,
// 다른 회원의 전화번호 없이 회원번호만 보여줍니다 (개인정보 과다노출 방지).
export async function POST(req: NextRequest) {
  const { accessToken } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ count: 0, items: [], demo: true });
  }
  if (!accessToken) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "인증이 만료됐어요." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("members")
    .select("member_no, is_business, created_at")
    .eq("referred_by", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((m) => ({
    member_no: m.member_no,
    is_business: m.is_business,
    created_at: m.created_at,
  }));

  return NextResponse.json({ count: items.length, items });
}
