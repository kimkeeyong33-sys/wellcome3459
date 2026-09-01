import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDealPush } from "@/lib/sendPush";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    category,
    region,
    originalPrice,
    dealPrice,
    totalQty,
    remainingQty,
    quantityUnit,
    minOrderQty,
    location,
    closesAt,
    requestId, // 판매자 신청에서 승인해서 넘어온 경우
    images,
    videoUrl,
    description,
    packageUnit,
    origin,
    spec,
    storageCondition,
  } = body;

  if (!title || !category || !region || !dealPrice || !totalQty || !closesAt) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, demo: true, id: "demo-deal" });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: catRow } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("name", category)
    .single();
  const { data: regRow } = await supabaseAdmin
    .from("regions")
    .select("id")
    .eq("name", region)
    .single();

  const { data: deal, error } = await supabaseAdmin
    .from("deals")
    .insert({
      title,
      category_id: catRow?.id,
      region_id: regRow?.id,
      original_price: originalPrice || dealPrice,
      deal_price: dealPrice,
      total_qty: totalQty,
      remaining_qty: remainingQty ?? totalQty,
      quantity_unit: quantityUnit || "개",
      min_order_qty: minOrderQty || null,
      location,
      closes_at: closesAt,
      status: "active",
      images: images ?? [],
      video_url: videoUrl ?? null,
      description: description || null,
      package_unit: packageUnit || null,
      origin: origin || null,
      spec: spec || null,
      storage_condition: storageCondition || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (requestId) {
    await supabaseAdmin
      .from("seller_requests")
      .update({ status: "approved", linked_deal_id: deal.id })
      .eq("id", requestId);
  }

  // 매물 등록이 확정되는 즉시, 해당 카테고리·지역 구독자에게 자동으로 알림을 보냅니다.
  const pushResult = await sendDealPush(deal.id);

  return NextResponse.json({ ok: true, id: deal.id, push: pushResult });
}
