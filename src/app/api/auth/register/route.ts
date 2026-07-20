import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["BUYER", "SELLER"]),
  company: z
    .object({
      name: z.string().min(1),
      registrationNumber: z.string().min(1),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  const { email, password, name, phone, role, company } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  let companyId: string | undefined;
  if (company) {
    const existingCompany = await prisma.company.findUnique({
      where: { registrationNumber: company.registrationNumber },
    });
    companyId = existingCompany
      ? existingCompany.id
      : (await prisma.company.create({ data: company })).id;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone, role, companyId },
  });

  const token = signToken({ userId: user.id, role: user.role });
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
