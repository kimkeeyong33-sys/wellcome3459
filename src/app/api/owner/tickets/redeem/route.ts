import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoRedeem } from "@/lib/cashticket/demoStore";

// 사장님이 QR 스캔(또는 코드 직접입력) 후 결제 금액을 확정해 잔액을 차감합니다.
export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  const amount = Number(body.amount);

  if (!code) return NextResponse.json({ error: "티켓 코드를 입력해주세요." }, { status: 400 });
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "결제 금액을 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    try {
      const ticket = demoRedeem(code, amount);
      if (ticket.storeId !== storeId) {
        return NextResponse.json({ error: "우리 매장에서 발행한 티켓이 아니에요." }, { status: 403 });
      }
      return NextResponse.json({
        ok: true,
        demo: true,
        balance: ticket.balance,
        status: ticket.status,
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const supabaseAdmin = getAdminClient();
  const { data: ticket, error } = await supabaseAdmin
    .from("ct_tickets")
    .select("id, store_id, balance, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "티켓을 찾을 수 없어요." }, { status: 404 });
  if (ticket.store_id !== storeId) {
    return NextResponse.json({ error: "우리 매장에서 발행한 티켓이 아니에요." }, { status: 403 });
  }
  if (ticket.status !== "active") {
    return NextResponse.json({ error: "이미 다 쓴 티켓이에요." }, { status: 400 });
  }
  if (new Date(ticket.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "유효기간이 지난 티켓이에요." }, { status: 400 });
  }
  if (amount > Number(ticket.balance)) {
    return NextResponse.json({ error: "사용 금액이 남은 잔액보다 많아요." }, { status: 400 });
  }

  const newBalance = Number(ticket.balance) - amount;
  const newStatus = newBalance === 0 ? "used" : "active";

  const { error: updateError } = await supabaseAdmin
    .from("ct_tickets")
    .update({ balance: newBalance, status: newStatus })
    .eq("id", ticket.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabaseAdmin.from("ct_transactions").insert({
    ticket_id: ticket.id,
    type: "use",
    amount,
  });

  return NextResponse.json({ ok: true, balance: newBalance, status: newStatus });
}
