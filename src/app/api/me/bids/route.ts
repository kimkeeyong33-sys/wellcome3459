import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const bids = await prisma.bid.findMany({
    where: { bidderId: payload.userId },
    orderBy: { createdAt: "desc" },
    include: { auction: { select: { id: true, title: true, status: true, currentPrice: true, endAt: true, winnerId: true } } },
  });

  return NextResponse.json({ bids });
}
