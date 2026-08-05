import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoCreateStore } from "@/lib/cashticket/demoStore";

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

  if (!ownerName || !storeName || !phone || !pin) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }
  if (!/^01[0-9]{8,9}$/.test(phone)) {
    return NextResponse.json({ error: "휴대폰 번호를 정확히 입력해주세요." }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "비밀번호는 숫자 4자리로 입력해주세요." }, { status: 400 });
  }

  if (!isSupabaseReady()) {
    try {
      const store = demoCreateStore({ ownerName, storeName, phone, pin, category });
      return NextResponse.json({
        ok: true,
        demo: true,
        store: { id: store.id, storeName: store.storeName, ownerName: store.ownerName },
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
    .insert({ owner_name: ownerName, store_name: storeName, phone, pin, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    store: { id: store.id, storeName: store.store_name, ownerName: store.owner_name },
  });
}
