"use client";

import { useState } from "react";

export default function UnsubscribePage() {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
      setError("가입 시 등록한 휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "처리 중 문제가 발생했어요.");
        return;
      }
      setDone(true);
    } catch {
      setError("처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="font-display text-2xl text-navy mb-2">알림이 해지됐어요</h1>
        <p className="text-gray500 text-base leading-relaxed">
          더 이상 매물 알림이 발송되지 않아요.
          <br />
          언제든 다시 가입하실 수 있어요.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-6 py-10">
      <h1 className="font-display text-2xl text-navy mb-2">알림 해지 · 탈퇴</h1>
      <p className="text-gray500 text-base leading-relaxed mb-6">
        가입하신 휴대폰 번호를 입력하시면, 알림 수신을 중단하고 등록된 개인정보를 삭제해드려요.
      </p>

      <label className="text-sm font-bold text-navy mb-2 block">휴대폰 번호</label>
      <input
        className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
        style={{ height: "52px" }}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="010-0000-0000"
      />

      {error && <div className="text-sm text-orange font-medium mt-3">{error}</div>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full mt-6 text-white font-bold rounded-2xl text-lg disabled:opacity-60"
        style={{ background: "#8A8A82", padding: "18px 0" }}
      >
        {submitting ? "처리 중..." : "알림 해지 및 탈퇴하기"}
      </button>

      <div className="mt-auto pt-16 flex flex-col items-center text-center">
        <img
          src="/images/manager.png"
          alt="점핑매니저"
          className="w-40 h-40 rounded-2xl object-contain bg-white mb-4"
        />
        <p className="text-sm text-gray500 leading-relaxed">
          떠나셔도 괜찮아요. 언제든 다시 오시면
          <br />
          점핑매니저가 반갑게 맞아드릴게요.
        </p>
      </div>
    </main>
  );
}
