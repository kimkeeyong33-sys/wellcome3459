import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoFindStoreByPhone } from "@/lib/cashticket/demoStore";

function normalizePhone(raw: string) {
  return raw.replace(/-/g, "").trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = normalizePhone(String(body.phone || ""));
  const pin = String(body.pin || "").trim();

  if (!phone || !pin) {
    return NextResponse.json({ error: "전화번호와 비밀번호를 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    const store = demoFindStoreByPhone(phone);
    if (!store || store.pin !== pin) {
      return NextResponse.json({ error: "전화번호 또는 비밀번호가 올바르지 않아요." }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      demo: true,
      store: { id: store.id, storeName: store.storeName, ownerName: store.ownerName },
    });
  }

  const supabaseAdmin = getAdminClient();
  const { data: store, error } = await supabaseAdmin
    .from("ct_stores")
    .select("id, store_name, owner_name, pin")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!store || store.pin !== pin) {
    return NextResponse.json({ error: "전화번호 또는 비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    store: { id: store.id, storeName: store.store_name, ownerName: store.owner_name },
  });
}
