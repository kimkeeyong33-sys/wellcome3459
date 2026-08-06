import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetPaymentRequest } from "@/lib/cashticket/demoStore";
import { isTossConfigured } from "@/lib/cashticket/toss";
import { getPublicStoreInfoDemo, getPublicStoreInfoSupabase } from "@/lib/cashticket/storeInfo";

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
    const store = getPublicStoreInfoDemo(request.storeId);
    return NextResponse.json({
      ok: true,
      demo: true,
      tossConfigured,
      request: {
        code: request.code,
        storeName: request.storeName,
        storeVerified: store.verified,
        storeAddress: store.address,
        storeBusinessHours: store.businessHours,
        storePublicPhone: store.publicPhone,
        storeProducts: store.products,
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
    .select("code, store_id, store_name, amount, memo, status, ticket_id")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ error: "결제 요청을 찾을 수 없어요." }, { status: 404 });

  const [store, ticketRow] = await Promise.all([
    getPublicStoreInfoSupabase(supabaseAdmin, request.store_id),
    request.ticket_id
      ? supabaseAdmin.from("ct_tickets").select("code").eq("id", request.ticket_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    ok: true,
    tossConfigured,
    request: {
      code: request.code,
      storeName: request.store_name,
      storeVerified: store.verified,
      storeAddress: store.address,
      storeBusinessHours: store.businessHours,
      storePublicPhone: store.publicPhone,
      storeProducts: store.products,
      amount: Number(request.amount),
      memo: request.memo,
      status: request.status,
      ticketCode: ticketRow?.data?.code ?? null,
    },
  });
}
