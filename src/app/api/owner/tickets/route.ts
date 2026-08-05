import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetStore, demoIssueTicket } from "@/lib/cashticket/demoStore";
import { generateTicketCode } from "@/lib/cashticket/code";

// 사장님이 새 금액권(티켓)을 발행합니다.
export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const amount = Number(body.amount);
  const validDays = Number(body.validDays) || 90;
  const memo = body.memo ? String(body.memo).trim() : undefined;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "발행할 금액을 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    const store = demoGetStore(storeId);
    if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });
    const ticket = demoIssueTicket({
      storeId,
      storeName: store.storeName,
      amount,
      validDays,
      memo,
    });
    return NextResponse.json({ ok: true, demo: true, code: ticket.code });
  }

  const supabaseAdmin = getAdminClient();
  const { data: store, error: storeError } = await supabaseAdmin
    .from("ct_stores")
    .select("id, store_name")
    .eq("id", storeId)
    .maybeSingle();
  if (storeError) return NextResponse.json({ error: storeError.message }, { status: 500 });
  if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });

  let code = generateTicketCode();
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

  let ticket = null;
  for (let attempt = 0; attempt < 5 && !ticket; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("ct_tickets")
      .insert({
        code,
        store_id: store.id,
        store_name: store.store_name,
        issued_amount: amount,
        balance: amount,
        memo,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (!error) {
      ticket = data;
    } else if (error.code === "23505") {
      code = generateTicketCode(); // 코드 충돌 시 재시도
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  if (!ticket) return NextResponse.json({ error: "티켓 발행에 실패했어요. 다시 시도해주세요." }, { status: 500 });

  await supabaseAdmin.from("ct_transactions").insert({
    ticket_id: ticket.id,
    type: "issue",
    amount,
  });

  return NextResponse.json({ ok: true, code: ticket.code });
}
