import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetStore, demoSetBusinessVerified } from "@/lib/cashticket/demoStore";
import { isNtsConfigured, verifyBusinessNumber } from "@/lib/cashticket/nts";

export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const businessNumber = String(body.businessNumber || "").replace(/-/g, "").trim();
  const businessOpenDate = String(body.businessOpenDate || "").replace(/-/g, "").trim();
  const businessRepName = String(body.businessRepName || "").trim();

  if (!/^\d{10}$/.test(businessNumber)) {
    return NextResponse.json({ error: "사업자등록번호는 숫자 10자리로 입력해주세요." }, { status: 400 });
  }
  if (!/^\d{8}$/.test(businessOpenDate) || !businessRepName) {
    return NextResponse.json({ error: "개업일자와 대표자 성함을 정확히 입력해주세요." }, { status: 400 });
  }
  if (!isNtsConfigured()) {
    return NextResponse.json(
      { error: "지금은 사업자등록 확인 기능이 준비 중이에요. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  const result = await verifyBusinessNumber({
    businessNumber,
    openDate: businessOpenDate,
    repName: businessRepName,
  });
  if (!result.verified) {
    return NextResponse.json(
      { error: result.reason || "입력하신 정보와 일치하는 사업자를 찾을 수 없어요." },
      { status: 400 }
    );
  }

  if (!isSupabaseReady()) {
    const store = demoGetStore(storeId);
    if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });
    demoSetBusinessVerified(storeId, true);
    return NextResponse.json({ ok: true, demo: true, businessVerified: true });
  }

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("ct_stores")
    .update({
      business_number: businessNumber,
      business_open_date: businessOpenDate,
      business_rep_name: businessRepName,
      business_verified: true,
    })
    .eq("id", storeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, businessVerified: true });
}
