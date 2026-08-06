import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoConfirmPaymentRequest, demoGetPaymentRequest } from "@/lib/cashticket/demoStore";
import { confirmTossPayment, isTossConfigured } from "@/lib/cashticket/toss";
import { generateTicketCode } from "@/lib/cashticket/code";

// 결제 승인 후 실제 티켓을 발급합니다.
// - 토스페이먼츠가 설정돼 있으면: paymentKey/orderId/amount를 받아 서버에서 금액을
//   대조하고 토스 confirm API로 실제 승인 여부를 검증한 뒤에만 티켓을 만듭니다.
// - 설정돼 있지 않으면(데모 모드): 검증할 실제 결제 수단이 없으므로 즉시 완료 처리합니다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const body = await req.json().catch(() => ({}));

  if (!isSupabaseReady()) {
    const existing = demoGetPaymentRequest(code);
    if (!existing) return NextResponse.json({ error: "결제 요청을 찾을 수 없어요." }, { status: 404 });

    if (isTossConfigured()) {
      const { paymentKey, orderId, amount } = body;
      if (!paymentKey || !orderId || Number(amount) !== existing.amount) {
        return NextResponse.json({ error: "결제 정보가 올바르지 않아요." }, { status: 400 });
      }
      const result = await confirmTossPayment({ paymentKey, orderId, amount: Number(amount) });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    }

    try {
      const request = demoConfirmPaymentRequest(code);
      return NextResponse.json({ ok: true, demo: true, ticketCode: request.ticketCode });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const supabaseAdmin = getAdminClient();
  const { data: request, error } = await supabaseAdmin
    .from("ct_payment_requests")
    .select("id, store_id, store_name, amount, valid_days, memo, status, ticket_id")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ error: "결제 요청을 찾을 수 없어요." }, { status: 404 });

  if (request.status === "paid") {
    const { data: ticket } = await supabaseAdmin
      .from("ct_tickets")
      .select("code")
      .eq("id", request.ticket_id)
      .maybeSingle();
    return NextResponse.json({ ok: true, ticketCode: ticket?.code ?? null }); // 멱등 처리
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "이미 취소된 결제 요청이에요." }, { status: 400 });
  }

  let orderId: string | undefined;
  if (isTossConfigured()) {
    const { paymentKey, orderId: reqOrderId, amount } = body;
    if (!paymentKey || !reqOrderId || Number(amount) !== Number(request.amount)) {
      return NextResponse.json({ error: "결제 정보가 올바르지 않아요." }, { status: 400 });
    }
    const result = await confirmTossPayment({ paymentKey, orderId: reqOrderId, amount: Number(amount) });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    orderId = reqOrderId;
  }

  // 티켓 발급 (사장님이 발행하는 것과 동일한 로직 — 코드 충돌 시 재시도)
  let ticketCode = generateTicketCode();
  const expiresAt = new Date(Date.now() + request.valid_days * 24 * 60 * 60 * 1000).toISOString();
  let ticket = null;
  for (let attempt = 0; attempt < 5 && !ticket; attempt++) {
    const { data, error: insertError } = await supabaseAdmin
      .from("ct_tickets")
      .insert({
        code: ticketCode,
        store_id: request.store_id,
        store_name: request.store_name,
        issued_amount: request.amount,
        balance: request.amount,
        memo: request.memo,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (!insertError) {
      ticket = data;
    } else if (insertError.code === "23505") {
      ticketCode = generateTicketCode();
    } else {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }
  if (!ticket) return NextResponse.json({ error: "티켓 발급에 실패했어요. 다시 시도해주세요." }, { status: 500 });

  await supabaseAdmin.from("ct_transactions").insert({
    ticket_id: ticket.id,
    type: "issue",
    amount: request.amount,
  });

  await supabaseAdmin
    .from("ct_payment_requests")
    .update({ status: "paid", ticket_id: ticket.id, order_id: orderId, paid_at: new Date().toISOString() })
    .eq("id", request.id);

  return NextResponse.json({ ok: true, ticketCode: ticket.code });
}
