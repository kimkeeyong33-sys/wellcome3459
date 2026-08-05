import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoDashboard } from "@/lib/cashticket/demoStore";

export async function GET(req: NextRequest) {
  const storeId = req.headers.get("x-store-id");
  if (!storeId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  if (!isSupabaseReady()) {
    return NextResponse.json({ ok: true, demo: true, ...demoDashboard(storeId) });
  }

  const supabaseAdmin = getAdminClient();

  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from("ct_tickets")
    .select("id, code, balance, status")
    .eq("store_id", storeId);
  if (ticketsError) return NextResponse.json({ error: ticketsError.message }, { status: 500 });

  const ticketIds = (tickets ?? []).map((t) => t.id);
  const codeByTicketId = new Map((tickets ?? []).map((t) => [t.id, t.code]));

  const { data: tx, error: txError } = ticketIds.length
    ? await supabaseAdmin
        .from("ct_transactions")
        .select("id, ticket_id, type, amount, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  const issuedTotal = (tx ?? [])
    .filter((t) => t.type === "issue")
    .reduce((s, t) => s + Number(t.amount), 0);
  const usedTotal = (tx ?? [])
    .filter((t) => t.type === "use")
    .reduce((s, t) => s + Number(t.amount), 0);
  const unusedBalance = (tickets ?? [])
    .filter((t) => t.status === "active")
    .reduce((s, t) => s + Number(t.balance), 0);

  const recent = (tx ?? []).slice(0, 20).map((t) => ({
    id: t.id,
    ticketId: t.ticket_id,
    type: t.type,
    amount: Number(t.amount),
    createdAt: t.created_at,
    ticketCode: codeByTicketId.get(t.ticket_id) ?? "",
  }));

  return NextResponse.json({
    ok: true,
    issuedTotal,
    usedTotal,
    unusedBalance,
    ticketCount: (tickets ?? []).length,
    recent,
  });
}
