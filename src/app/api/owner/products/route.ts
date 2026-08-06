import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoListProducts, demoCreateProduct } from "@/lib/cashticket/demoStore";

export async function GET(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  if (!isSupabaseReady()) {
    const products = demoListProducts(storeId);
    return NextResponse.json({
      ok: true,
      demo: true,
      products: products.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    });
  }

  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("ct_products")
    .select("id, name, price")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    products: (data ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.price) })),
  });
}

export async function POST(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const price = Number(body.price);

  if (!name) return NextResponse.json({ error: "상품·서비스 이름을 입력해주세요." }, { status: 400 });
  if (!price || price <= 0) return NextResponse.json({ error: "가격을 입력해주세요." }, { status: 400 });

  if (!isSupabaseReady()) {
    const product = demoCreateProduct({ storeId, name, price });
    return NextResponse.json({ ok: true, demo: true, product: { id: product.id, name, price } });
  }

  const supabaseAdmin = getAdminClient();
  const { count } = await supabaseAdmin
    .from("ct_products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);

  const { data: product, error } = await supabaseAdmin
    .from("ct_products")
    .insert({ store_id: storeId, name, price, sort_order: count ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, product: { id: product.id, name: product.name, price: Number(product.price) } });
}
