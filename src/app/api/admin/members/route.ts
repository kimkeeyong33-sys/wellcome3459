import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

// 최근 가입 회원 목록 (관리자용 - 신규 가입 현황 파악)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ items: [], demo: true });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  const { data: members, error } = await supabaseAdmin
    .from("members")
    .select("id, phone, is_business, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const memberIds = (members ?? []).map((m) => m.id);
  const catsByMember: Record<string, string[]> = {};
  const regsByMember: Record<string, string[]> = {};

  if (memberIds.length > 0) {
    const [{ data: catRows }, { data: regRows }] = await Promise.all([
      supabaseAdmin.from("member_categories").select("member_id, categories(name)").in("member_id", memberIds),
      supabaseAdmin.from("member_regions").select("member_id, regions(name)").in("member_id", memberIds),
    ]);

    (catRows ?? []).forEach((r) => {
      const name = (r.categories as unknown as { name: string } | null)?.name;
      if (!name) return;
      (catsByMember[r.member_id] ??= []).push(name);
    });
    (regRows ?? []).forEach((r) => {
      const name = (r.regions as unknown as { name: string } | null)?.name;
      if (!name) return;
      (regsByMember[r.member_id] ??= []).push(name);
    });
  }

  const items = (members ?? []).map((m) => ({
    id: m.id,
    phone: m.phone,
    is_business: m.is_business,
    created_at: m.created_at,
    categories: catsByMember[m.id] ?? [],
    regions: regsByMember[m.id] ?? [],
  }));

  return NextResponse.json({ items });
}
