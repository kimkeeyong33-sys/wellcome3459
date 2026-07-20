import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ companies });
}
