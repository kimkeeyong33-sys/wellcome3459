import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeAuctionIfDue } from "@/lib/auctionEngine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await finalizeAuctionIfDue(id);

  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, company: { select: { name: true } } } },
      winner: { select: { id: true, name: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { bidder: { select: { id: true, name: true } } },
      },
    },
  });

  if (!auction) return NextResponse.json({ error: "경매를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ auction });
}
