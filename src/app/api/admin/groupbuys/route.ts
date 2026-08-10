import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });

  const body = await req.json();
  const { title, category, region, location, tiers, targetQty, deadline, images, description } = body;

  if (!title || !category || !region || !Array.isArray(tiers) || tiers.length === 0 || !targetQty || !deadline) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const sortedTiers = [...tiers].sort((a, b) => a.qty - b.qty);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, demo: true, id: "demo-groupbuy" });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: catRow } = await supabaseAdmin.from("categories").select("id").eq("name", category).single();
  const { data: regRow } = await supabaseAdmin.from("regions").select("id").eq("name", region).single();

  const { data: groupBuy, error } = await supabaseAdmin
    .from("group_buys")
    .insert({
      title,
      category_id: catRow?.id,
      region_id: regRow?.id,
      location,
      tiers: sortedTiers,
      target_qty: targetQty,
      current_qty: 0,
      deadline,
      status: "open",
      images: images ?? [],
      description: description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: groupBuy.id });
}
