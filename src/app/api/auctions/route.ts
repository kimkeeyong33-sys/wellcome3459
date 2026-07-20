import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { finalizeDueAuctions } from "@/lib/auctionEngine";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  startPrice: z.number().positive(),
  minIncrement: z.number().positive().default(1000),
  buyNowPrice: z.number().positive().optional(),
  quantity: z.number().int().positive().default(1),
  unit: z.string().default("개"),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

export async function GET(req: NextRequest) {
  await finalizeDueAuctions();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "CANCELLED"] as const;
  const status = validStatuses.find((s) => s === statusParam);
  const categoryId = searchParams.get("categoryId");
  const sellerId = searchParams.get("sellerId");
  const q = searchParams.get("q");

  const auctions = await prisma.auction.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      seller: { select: { id: true, name: true, company: { select: { name: true } } } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ auctions });
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (payload.role !== "SELLER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "판매자만 경매를 등록할 수 있습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  const data = parsed.data;

  if (data.endAt <= data.startAt) {
    return NextResponse.json({ error: "마감시각은 시작시각 이후여야 합니다." }, { status: 400 });
  }
  if (data.buyNowPrice != null && data.buyNowPrice <= data.startPrice) {
    return NextResponse.json({ error: "즉시구매가는 시작가보다 높아야 합니다." }, { status: 400 });
  }

  const now = new Date();
  const status = data.startAt <= now ? "ACTIVE" : "SCHEDULED";

  const auction = await prisma.auction.create({
    data: {
      title: data.title,
      description: data.description,
      images: data.images,
      categoryId: data.categoryId,
      sellerId: payload.userId,
      startPrice: data.startPrice,
      currentPrice: data.startPrice,
      minIncrement: data.minIncrement,
      buyNowPrice: data.buyNowPrice,
      quantity: data.quantity,
      unit: data.unit,
      startAt: data.startAt,
      endAt: data.endAt,
      status,
    },
  });

  return NextResponse.json({ auction }, { status: 201 });
}
