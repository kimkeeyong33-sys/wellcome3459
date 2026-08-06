import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetStore, demoCreatePaymentRequest } from "@/lib/cashticket/demoStore";
import { generateTicketCode } from "@/lib/cashticket/code";

// 사장님이 "고객 결제 받고 발행" 방식을 선택했을 때 결제 요청을 만듭니다.
// 실제 티켓은 고객이 결제를 완료해야만(POST /api/payment-requests/[code]/confirm) 발급돼요.
export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const amount = Number(body.amount);
  const validDays = Number(body.validDays) || 90;
  const memo = body.memo ? String(body.memo).trim() : undefined;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "받을 금액을 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    const store = demoGetStore(storeId);
    if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });
    const req_ = demoCreatePaymentRequest({
      storeId,
      storeName: store.storeName,
      amount,
      validDays,
      memo,
    });
    return NextResponse.json({ ok: true, demo: true, code: req_.code });
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
  let request = null;
  for (let attempt = 0; attempt < 5 && !request; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("ct_payment_requests")
      .insert({
        code,
        store_id: store.id,
        store_name: store.store_name,
        amount,
        valid_days: validDays,
        memo,
        status: "pending",
      })
      .select()
      .single();
    if (!error) {
      request = data;
    } else if (error.code === "23505") {
      code = generateTicketCode();
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  if (!request) return NextResponse.json({ error: "요청 생성에 실패했어요. 다시 시도해주세요." }, { status: 500 });

  return NextResponse.json({ ok: true, code: request.code });
}
