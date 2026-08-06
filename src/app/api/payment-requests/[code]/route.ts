import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetPaymentRequest } from "@/lib/cashticket/demoStore";
import { isTossConfigured } from "@/lib/cashticket/toss";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const tossConfigured = isTossConfigured();

  if (!isSupabaseReady()) {
    const request = demoGetPaymentRequest(code);
    if (!request) return NextResponse.json({ error: "결제 요청을 찾을 수 없어요." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      demo: true,
      tossConfigured,
      request: {
        code: request.code,
        storeName: request.storeName,
        amount: request.amount,
        memo: request.memo ?? null,
        status: request.status,
        ticketCode: request.ticketCode ?? null,
      },
    });
  }

  const supabaseAdmin = getAdminClient();
  const { data: request, error } = await supabaseAdmin
    .from("ct_payment_requests")
    .select("code, store_name, amount, memo, status, ticket_id")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ error: "결제 요청을 찾을 수 없어요." }, { status: 404 });

  let ticketCode: string | null = null;
  if (request.ticket_id) {
    const { data: ticket } = await supabaseAdmin
      .from("ct_tickets")
      .select("code")
      .eq("id", request.ticket_id)
      .maybeSingle();
    ticketCode = ticket?.code ?? null;
  }

  return NextResponse.json({
    ok: true,
    tossConfigured,
    request: {
      code: request.code,
      storeName: request.store_name,
      amount: Number(request.amount),
      memo: request.memo,
      status: request.status,
      ticketCode,
    },
  });
}
