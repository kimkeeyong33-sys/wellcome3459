import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Auctions transition status lazily on read/write instead of via a cron job:
 * SCHEDULED -> ACTIVE once startAt passes, ACTIVE -> ENDED once endAt passes
 * (winner = highest bidder, if any). Keeping this idempotent means every
 * API path can call it without needing a background worker for the MVP.
 */
export async function finalizeAuctionIfDue(auctionId: string) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return null;

  const now = new Date();

  if (auction.status === "SCHEDULED" && now >= auction.startAt && now < auction.endAt) {
    return prisma.auction.update({ where: { id: auctionId }, data: { status: "ACTIVE" } });
  }

  if ((auction.status === "SCHEDULED" || auction.status === "ACTIVE") && now >= auction.endAt) {
    const topBid = await prisma.bid.findFirst({
      where: { auctionId },
      orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
    });
    return prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "ENDED",
        winnerId: topBid?.bidderId ?? null,
        currentPrice: topBid?.amount ?? auction.currentPrice,
      },
    });
  }

  return auction;
}

export async function finalizeDueAuctions() {
  const now = new Date();
  const due = await prisma.auction.findMany({
    where: {
      status: { in: ["SCHEDULED", "ACTIVE"] },
      OR: [{ startAt: { lte: now } }, { endAt: { lte: now } }],
    },
    select: { id: true },
  });
  for (const a of due) {
    await finalizeAuctionIfDue(a.id);
  }
}

type AuctionRecord = Awaited<ReturnType<typeof prisma.auction.findUniqueOrThrow>>;

export type BidResult =
  | { ok: true; auction: AuctionRecord; boughtNow: boolean }
  | { ok: false; error: string };

export async function placeBid(auctionId: string, bidderId: string, amount: number): Promise<BidResult> {
  await finalizeAuctionIfDue(auctionId);

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return { ok: false, error: "경매를 찾을 수 없습니다." };
  if (auction.status !== "ACTIVE") return { ok: false, error: "현재 입찰 가능한 경매가 아닙니다." };
  if (auction.sellerId === bidderId) return { ok: false, error: "본인 경매에는 입찰할 수 없습니다." };

  const minRequired = Number(auction.currentPrice) + Number(auction.minIncrement);
  if (amount < minRequired) {
    return { ok: false, error: `최소 입찰가는 ${minRequired.toLocaleString()}원 입니다.` };
  }

  const boughtNow = auction.buyNowPrice != null && amount >= Number(auction.buyNowPrice);

  try {
    const updatedAuction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Compare-and-swap on currentPrice guards against a lost update when two
      // bidders race: whoever's write lands first "wins" the CAS, the loser retries.
      const cas = await tx.auction.updateMany({
        where: { id: auctionId, status: "ACTIVE", currentPrice: auction.currentPrice },
        data: {
          currentPrice: amount,
          ...(boughtNow
            ? { status: "ENDED" as const, winnerId: bidderId, endAt: new Date() }
            : {}),
        },
      });
      if (cas.count === 0) {
        throw new Error("CONFLICT");
      }
      await tx.bid.create({ data: { auctionId, bidderId, amount } });
      return tx.auction.findUniqueOrThrow({ where: { id: auctionId } });
    });
    return { ok: true, auction: updatedAuction, boughtNow };
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      return { ok: false, error: "다른 입찰이 먼저 반영되었습니다. 다시 시도해주세요." };
    }
    throw err;
  }
}
