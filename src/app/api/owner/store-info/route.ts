import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetStore, demoUpdateStoreInfo } from "@/lib/cashticket/demoStore";

export async function GET(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  if (!isSupabaseReady()) {
    const store = demoGetStore(storeId);
    if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });
    return NextResponse.json({
      ok: true,
      demo: true,
      storeInfo: {
        address: store.address ?? "",
        businessHours: store.businessHours ?? "",
        publicPhone: store.publicPhone ?? "",
      },
    });
  }

  const supabaseAdmin = getAdminClient();
  const { data: store, error } = await supabaseAdmin
    .from("ct_stores")
    .select("address, business_hours, public_phone")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });

  return NextResponse.json({
    ok: true,
    storeInfo: {
      address: store.address ?? "",
      businessHours: store.business_hours ?? "",
      publicPhone: store.public_phone ?? "",
    },
  });
}

export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const address = String(body.address || "").trim();
  const businessHours = String(body.businessHours || "").trim();
  const publicPhone = String(body.publicPhone || "").trim();

  if (!isSupabaseReady()) {
    const store = demoUpdateStoreInfo(storeId, { address, businessHours, publicPhone });
    if (!store) return NextResponse.json({ error: "매장 정보를 찾을 수 없어요." }, { status: 401 });
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("ct_stores")
    .update({ address, business_hours: businessHours, public_phone: publicPhone })
    .eq("id", storeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
