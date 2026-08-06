"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PayFailPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={null}>
      <PayFailInner params={params} />
    </Suspense>
  );
}

function PayFailInner({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "결제가 취소됐거나 실패했어요.";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
      <div className="text-4xl">😢</div>
      <div className="text-lg font-bold text-navy">{message}</div>
      <Link
        href={`/pay/${code}`}
        className="text-white text-center font-bold rounded-2xl text-base mt-3 px-8"
        style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "14px 32px" }}
      >
        다시 시도하기
      </Link>
    </main>
  );
}
