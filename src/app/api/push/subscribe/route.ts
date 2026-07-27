import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { memberId, subscription } = await req.json();

  if (!memberId || !subscription?.endpoint) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      member_id: memberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth_key: subscription.keys?.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
