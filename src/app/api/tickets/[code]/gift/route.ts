import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGift } from "@/lib/cashticket/demoStore";
import { generateTicketCode } from "@/lib/cashticket/code";

// 고객이 남은 잔액 일부(또는 전부)를 새 티켓으로 나눠 다른 사람에게 선물합니다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const body = await req.json();
  const amount = Number(body.amount);

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "선물할 금액을 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    try {
      const child = demoGift(code, amount);
      return NextResponse.json({ ok: true, demo: true, code: child.code });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const supabaseAdmin = getAdminClient();
  const { data: parent, error } = await supabaseAdmin
    .from("ct_tickets")
    .select("id, store_id, store_name, balance, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!parent) return NextResponse.json({ error: "티켓을 찾을 수 없어요." }, { status: 404 });
  if (parent.status !== "active") {
    return NextResponse.json({ error: "이미 다 쓴 티켓이에요." }, { status: 400 });
  }
  if (amount > Number(parent.balance)) {
    return NextResponse.json({ error: "선물할 금액이 남은 잔액보다 많아요." }, { status: 400 });
  }

  let newCode = generateTicketCode();
  let child = null;
  for (let attempt = 0; attempt < 5 && !child; attempt++) {
    const { data, error: insertError } = await supabaseAdmin
      .from("ct_tickets")
      .insert({
        code: newCode,
        store_id: parent.store_id,
        store_name: parent.store_name,
        issued_amount: amount,
        balance: amount,
        parent_ticket_id: parent.id,
        status: "active",
        expires_at: parent.expires_at,
      })
      .select()
      .single();
    if (!insertError) {
      child = data;
    } else if (insertError.code === "23505") {
      newCode = generateTicketCode();
    } else {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }
  if (!child) return NextResponse.json({ error: "선물하기에 실패했어요. 다시 시도해주세요." }, { status: 500 });

  const newParentBalance = Number(parent.balance) - amount;
  await supabaseAdmin
    .from("ct_tickets")
    .update({ balance: newParentBalance, status: newParentBalance === 0 ? "used" : "active" })
    .eq("id", parent.id);

  await supabaseAdmin.from("ct_transactions").insert([
    { ticket_id: parent.id, type: "gift_out", amount },
    { ticket_id: child.id, type: "gift_in", amount },
  ]);

  return NextResponse.json({ ok: true, code: child.code });
}
