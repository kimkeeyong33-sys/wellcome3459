import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoCreateStore, demoSetBusinessVerified } from "@/lib/cashticket/demoStore";
import { isNtsConfigured, verifyBusinessNumber } from "@/lib/cashticket/nts";

function normalizePhone(raw: string) {
  return raw.replace(/-/g, "").trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ownerName = String(body.ownerName || "").trim();
  const storeName = String(body.storeName || "").trim();
  const phone = normalizePhone(String(body.phone || ""));
  const pin = String(body.pin || "").trim();
  const category = body.category ? String(body.category).trim() : undefined;

  // 사업자등록번호는 선택 입력이에요 — 넣으면 국세청 API로 즉시 확인하고,
  // 통과하면 고객 화면에 "인증 매장" 배지가 붙어요. 안 넣어도 가입엔 문제 없어요.
  const businessNumber = body.businessNumber ? String(body.businessNumber).replace(/-/g, "").trim() : undefined;
  const businessOpenDate = body.businessOpenDate ? String(body.businessOpenDate).replace(/-/g, "").trim() : undefined;
  const businessRepName = body.businessRepName ? String(body.businessRepName).trim() : undefined;

  if (!ownerName || !storeName || !phone || !pin) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }
  if (!/^01[0-9]{8,9}$/.test(phone)) {
    return NextResponse.json({ error: "휴대폰 번호를 정확히 입력해주세요." }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "비밀번호는 숫자 4자리로 입력해주세요." }, { status: 400 });
  }
  if (businessNumber && !/^\d{10}$/.test(businessNumber)) {
    return NextResponse.json({ error: "사업자등록번호는 숫자 10자리로 입력해주세요." }, { status: 400 });
  }

  let businessVerified = false;
  if (businessNumber && businessOpenDate && businessRepName && isNtsConfigured()) {
    try {
      const result = await verifyBusinessNumber({
        businessNumber,
        openDate: businessOpenDate,
        repName: businessRepName,
      });
      businessVerified = result.verified;
    } catch {
      businessVerified = false; // 조회 실패해도 가입 자체는 막지 않음
    }
  }

  if (!isSupabaseReady()) {
    try {
      const store = demoCreateStore({
        ownerName,
        storeName,
        phone,
        pin,
        category,
        businessNumber,
      });
      if (businessVerified) demoSetBusinessVerified(store.id, true);
      return NextResponse.json({
        ok: true,
        demo: true,
        store: {
          id: store.id,
          storeName: store.storeName,
          ownerName: store.ownerName,
          businessVerified,
        },
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 409 });
    }
  }

  const supabaseAdmin = getAdminClient();
  const { data: existing } = await supabaseAdmin
    .from("ct_stores")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "이미 등록된 전화번호예요. 로그인을 이용해주세요." },
      { status: 409 }
    );
  }

  const { data: store, error } = await supabaseAdmin
    .from("ct_stores")
    .insert({
      owner_name: ownerName,
      store_name: storeName,
      phone,
      pin,
      category,
      business_number: businessNumber,
      business_open_date: businessOpenDate,
      business_rep_name: businessRepName,
      business_verified: businessVerified,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    store: {
      id: store.id,
      storeName: store.store_name,
      ownerName: store.owner_name,
      businessVerified: store.business_verified,
    },
  });
}
