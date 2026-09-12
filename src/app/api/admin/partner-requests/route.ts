import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const auth = checkAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ items: [], demo: true });

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabaseAdmin
    .from("partner_requests")
    .select("id, member_id, business_type, channel_info, message, status, created_at, members(phone, company_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = checkAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, status } = await req.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ ok: true, demo: true });

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  const { data: reqRow, error: fetchError } = await supabaseAdmin
    .from("partner_requests")
    .select("member_id")
    .eq("id", id)
    .single();
  if (fetchError || !reqRow) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });

  const { error: updateError } = await supabaseAdmin
    .from("partner_requests")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: auth.admin.name })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (status === "approved") {
    const { error: memberError } = await supabaseAdmin
      .from("members")
      .update({ is_official_partner: true })
      .eq("id", reqRow.member_id);
    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
