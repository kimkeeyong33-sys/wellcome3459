import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 추천 링크의 짧은 코드(ref_code)를 추천인의 회원 id로 변환합니다.
// members 테이블은 본인 행만 조회 가능하도록 RLS가 걸려있어 anon 키로는 조회할 수 없으므로,
// service_role로 id 하나만 최소한으로 꺼내 돌려줍니다 (다른 개인정보는 노출하지 않음).
export async function POST(req: NextRequest) {
  const { code } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !code) {
    return NextResponse.json({ id: null });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("ref_code", code)
    .maybeSingle();

  return NextResponse.json({ id: data?.id ?? null });
}
