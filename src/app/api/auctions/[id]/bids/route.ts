import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { placeBid } from "@/lib/auctionEngine";

const bidSchema = z.object({ amount: z.number().positive() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입찰 금액이 올바르지 않습니다." }, { status: 400 });
  }

  const result = await placeBid(id, payload.userId, parsed.data.amount);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ auction: result.auction, boughtNow: result.boughtNow });
}
