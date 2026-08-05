"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setOwnerSession } from "@/lib/cashticket/wallet";

const CATEGORIES = ["음식점", "카페", "미용실", "네일샵", "세탁소", "기타"];

export default function OwnerSignupPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinCheck, setPinCheck] = useState("");
  const [category, setCategory] = useState("음식점");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!storeName.trim() || !ownerName.trim()) {
      setError("매장 이름과 사장님 성함을 입력해주세요.");
      return;
    }
    if (!/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
      setError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("비밀번호는 숫자 4자리로 입력해주세요.");
      return;
    }
    if (pin !== pinCheck) {
      setError("비밀번호가 서로 달라요. 다시 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, storeName, phone, pin, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "가입 중 오류가 발생했어요.");
        return;
      }
      setOwnerSession({
        storeId: data.store.id,
        storeName: data.store.storeName,
        ownerName: data.store.ownerName,
      });
      router.push("/owner/dashboard");
    } catch {
      setError("가입 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
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
        <h1 className="font-display text-2xl mt-3 leading-snug">
          매장 등록하고
          <br />1분 만에 시작해요
        </h1>
        <p className="text-white/80 text-sm mt-2">사업자등록증 없이도 바로 시작할 수 있어요.</p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5" style={{ paddingBottom: "108px" }}>
        <Field label="매장 이름">
          <input
            className="input"
            placeholder="예: 행복분식"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </Field>

        <Field label="사장님 성함">
          <input
            className="input"
            placeholder="예: 김철수"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </Field>

        <Field label="업종">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-sm py-2.5 rounded-xl border-2 font-bold text-center ${
                  category === c ? "bg-navy text-white border-navy" : "border-gray200 text-gray500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="휴대폰 번호">
          <input
            className="input"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
          />
        </Field>

        <Field label="비밀번호 (숫자 4자리)" hint="로그인할 때 사용해요">
          <input
            className="input tracking-[0.3em]"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
          />
        </Field>

        <Field label="비밀번호 확인">
          <input
            className="input tracking-[0.3em]"
            placeholder="••••"
            value={pinCheck}
            onChange={(e) => setPinCheck(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
          />
        </Field>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}

        <div className="text-xs text-gray500 leading-relaxed">
          이미 등록하셨나요?{" "}
          <Link href="/owner/login" className="text-orange font-bold underline">
            로그인하기
          </Link>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
        style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)" }}
      >
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "등록 중..." : "매장 등록하기"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          height: 56px;
          border: 2px solid #e4e7eb;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 17px;
          outline: none;
        }
        .input:focus {
          border-color: #f2891f;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-base font-bold text-navy mb-2 flex items-center gap-1.5">
        {label}
        {hint && <span className="text-xs font-medium text-gray500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
