import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signAdminToken, checkLoginRateLimit, recordLoginFailure, clearLoginFailures } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const rate = checkLoginRateLimit(req);
  if (!rate.ok) return NextResponse.json({ error: rate.error }, { status: rate.status });

  const { password } = await req.json();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data } = await supabaseAdmin.rpc("verify_admin_login", { p_password: password ?? "" });
  const admin = Array.isArray(data) ? data[0] : null;

  if (!admin) {
    recordLoginFailure(req);
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  clearLoginFailures(req);
  await supabaseAdmin.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);

  return NextResponse.json({ token: signAdminToken(admin), admin: { name: admin.name, role: admin.role } });
}
