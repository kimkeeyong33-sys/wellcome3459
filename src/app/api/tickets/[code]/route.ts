import { NextRequest, NextResponse } from "next/server";
import { isSupabaseReady, getAdminClient } from "@/lib/cashticket/adminClient";
import { demoGetStore, demoGetTicket, demoGetTransactions } from "@/lib/cashticket/demoStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();

  if (!isSupabaseReady()) {
    const ticket = demoGetTicket(code);
    if (!ticket) return NextResponse.json({ error: "티켓을 찾을 수 없어요." }, { status: 404 });
    const tx = demoGetTransactions(ticket.id);
    const store = demoGetStore(ticket.storeId);
    return NextResponse.json({
      ok: true,
      demo: true,
      ticket: {
        code: ticket.code,
        storeName: ticket.storeName,
        storeVerified: store?.businessVerified ?? false,
        issuedAmount: ticket.issuedAmount,
        balance: ticket.balance,
        status: ticket.status,
        expiresAt: ticket.expiresAt,
        memo: ticket.memo ?? null,
      },
      transactions: tx.map((t) => ({ type: t.type, amount: t.amount, createdAt: t.createdAt })),
    });
  }

  const supabaseAdmin = getAdminClient();
  const { data: ticket, error } = await supabaseAdmin
    .from("ct_tickets")
    .select("id, code, store_id, store_name, issued_amount, balance, status, expires_at, memo")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "티켓을 찾을 수 없어요." }, { status: 404 });

  const [{ data: tx }, { data: store }] = await Promise.all([
    supabaseAdmin
      .from("ct_transactions")
      .select("type, amount, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("ct_stores").select("business_verified").eq("id", ticket.store_id).maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    ticket: {
      code: ticket.code,
      storeName: ticket.store_name,
      storeVerified: store?.business_verified ?? false,
      issuedAmount: Number(ticket.issued_amount),
      balance: Number(ticket.balance),
      status: ticket.status,
      expiresAt: ticket.expires_at,
      memo: ticket.memo,
    },
    transactions: (tx ?? []).map((t) => ({
      type: t.type,
      amount: Number(t.amount),
      createdAt: t.created_at,
    })),
  });
}
