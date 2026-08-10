import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 회원가입 없이도 "참여하기"를 누르면 전화번호와 수량만으로 점핑매니저에게 리드가 전달됩니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { phone, quantity } = await req.json();

  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  const qty = Number(quantity) || 1;
  if (digits.length < 9 || qty < 1) {
    return NextResponse.json({ error: "휴대폰 번호와 수량을 확인해주세요." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // 데모 모드: 저장 없이 성공만 반환
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  const { error } = await supabaseAdmin.rpc("join_group_buy", {
    p_group_buy_id: id,
    p_member_id: null,
    p_phone: digits,
    p_quantity: qty,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
