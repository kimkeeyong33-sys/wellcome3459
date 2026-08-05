"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwnerSession, setOwnerSession } from "@/lib/cashticket/wallet";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getOwnerSession()) router.replace("/owner/dashboard");
  }, [router]);

  const submit = async () => {
    setError(null);
    if (!phone || !pin) {
      setError("휴대폰 번호와 비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인에 실패했어요.");
        return;
      }
      setOwnerSession({
        storeId: data.store.id,
        storeName: data.store.storeName,
        ownerName: data.store.ownerName,
      });
      router.push("/owner/dashboard");
    } catch {
      setError("로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-8 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/" className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3 leading-snug">사장님 로그인</h1>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        <div>
          <label className="text-base font-bold text-navy mb-2 block">휴대폰 번호</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
            style={{ height: "56px" }}
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-base font-bold text-navy mb-2 block">비밀번호</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange tracking-[0.3em]"
            style={{ height: "56px" }}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            type="password"
          />
        </div>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60 mt-2"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "확인 중..." : "로그인"}
        </button>

        <div className="text-center text-sm text-gray500">
          아직 등록 전이신가요?{" "}
          <Link href="/owner/signup" className="text-orange font-bold underline">
            매장 등록하기
          </Link>
        </div>
      </div>
    </main>
  );
}
