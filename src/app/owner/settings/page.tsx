"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwnerSession, setOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";

export default function OwnerSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessOpenDate, setBusinessOpenDate] = useState("");
  const [businessRepName, setBusinessRepName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
  }, [router]);

  const submit = async () => {
    if (!session) return;
    setError(null);
    if (!/^\d{10}$/.test(businessNumber)) {
      setError("사업자등록번호는 숫자 10자리로 입력해주세요.");
      return;
    }
    if (!/^\d{8}$/.test(businessOpenDate) || !businessRepName.trim()) {
      setError("개업일자와 대표자 성함을 정확히 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/verify-business", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-store-id": session.storeId },
        body: JSON.stringify({ businessNumber, businessOpenDate, businessRepName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "확인 중 오류가 발생했어요.");
        return;
      }
      setOwnerSession({ ...session, businessVerified: true });
      setDone(true);
    } catch {
      setError("확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  if (session.businessVerified || done) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
        <div className="text-4xl">🏅</div>
        <div className="text-lg font-bold text-navy">인증 매장이에요</div>
        <div className="text-sm text-gray500">고객 화면에 인증 배지가 표시돼요.</div>
        <Link href="/owner/dashboard" className="text-orange font-bold underline mt-3">
          대시보드로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/owner/dashboard" className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3">사업자등록 인증</h1>
        <p className="text-white/80 text-sm mt-2">
          국세청에서 즉시 확인돼요. 통과하면 고객 화면에 &ldquo;인증 매장&rdquo; 배지가 붙어요.
        </p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        <div>
          <label className="text-base font-bold text-navy mb-2 block">사업자등록번호</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
            style={{ height: "56px" }}
            placeholder="숫자 10자리"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-base font-bold text-navy mb-2 block">개업일자</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
            style={{ height: "56px" }}
            placeholder="20200101"
            value={businessOpenDate}
            onChange={(e) => setBusinessOpenDate(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-base font-bold text-navy mb-2 block">대표자 성함</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
            style={{ height: "56px" }}
            placeholder="사업자등록증에 적힌 이름"
            value={businessRepName}
            onChange={(e) => setBusinessRepName(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60 mt-2"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "확인 중..." : "인증하기"}
        </button>
      </div>
    </main>
  );
}
