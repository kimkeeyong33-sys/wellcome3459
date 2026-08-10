import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    location,
    startPrice,
    floorPrice,
    priceStep,
    dropIntervalSec,
    totalQty,
    endsAt,
    images,
    description,
  } = body;

  if (!title || !category || !region || !startPrice || !floorPrice || !priceStep || !totalQty || !endsAt) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }
  if (Number(floorPrice) > Number(startPrice)) {
    return NextResponse.json({ error: "바닥가는 시작가보다 낮아야 합니다." }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, demo: true, id: "demo-auction" });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: catRow } = await supabaseAdmin.from("categories").select("id").eq("name", category).single();
  const { data: regRow } = await supabaseAdmin.from("regions").select("id").eq("name", region).single();

  const { data: auction, error } = await supabaseAdmin
    .from("auctions")
    .insert({
      title,
      category_id: catRow?.id,
      region_id: regRow?.id,
      location,
      start_price: startPrice,
      floor_price: floorPrice,
      price_step: priceStep,
      drop_interval_sec: dropIntervalSec || 600,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
      total_qty: totalQty,
      remaining_qty: totalQty,
      status: "active",
      images: images ?? [],
      description: description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: auction.id });
}
