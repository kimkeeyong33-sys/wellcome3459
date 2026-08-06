import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoDeleteProduct } from "@/lib/cashticket/demoStore";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { id } = await params;

  if (!isSupabaseReady()) {
    demoDeleteProduct(storeId, id);
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("ct_products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId); // 다른 매장 상품은 지울 수 없도록 store_id까지 조건에 포함

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
