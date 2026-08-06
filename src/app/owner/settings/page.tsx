"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwnerSession, setOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";

export default function OwnerSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/owner/dashboard" className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3">매장 정보 관리</h1>
        <p className="text-white/80 text-sm mt-2">
          고객이 결제·티켓 화면에서 볼 수 있는 정보예요.
        </p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-8" style={{ paddingBottom: "48px" }}>
        <StoreInfoSection session={session} />
        <BusinessVerifySection session={session} onVerified={() => setSession({ ...session, businessVerified: true })} />
        <Link href="/owner/menu" className="flex items-center justify-between rounded-xl bg-gray100 px-4 py-3.5">
          <div>
            <div className="text-sm font-bold text-navy">🍽️ 상품·가격표 관리</div>
            <div className="text-xs text-gray500 mt-0.5">고객에게 보여줄 메뉴와 가격을 등록해요</div>
          </div>
          <span className="text-gray500">›</span>
        </Link>
      </div>
    </main>
  );
}

function StoreInfoSection({ session }: { session: OwnerSession }) {
  const [address, setAddress] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/owner/store-info", { headers: { "x-store-id": session.storeId } });
      const data = await res.json();
      if (res.ok) {
        setAddress(data.storeInfo.address);
        setBusinessHours(data.storeInfo.businessHours);
        setPublicPhone(data.storeInfo.publicPhone);
      }
      setLoading(false);
    })();
  }, [session.storeId]);

  const save = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/owner/store-info", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-store-id": session.storeId },
        body: JSON.stringify({ address, businessHours, publicPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "저장 중 오류가 발생했어요.");
        return;
      }
      setSaved(true);
    } catch {
      setError("저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="text-lg font-bold text-navy mb-1">📍 매장 위치 · 연락처</div>
      <div className="text-xs text-gray500 mb-4">
        비워두면 고객 화면에 표시되지 않아요. 언제든 수정할 수 있어요.
      </div>

      {loading ? (
        <div className="text-sm text-gray500">불러오는 중...</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="text-sm font-bold text-gray900 mb-1.5 block">매장 주소</label>
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              placeholder="예: 서울시 마포구 월드컵로 10길 5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray900 mb-1.5 block">영업시간</label>
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              placeholder="예: 매일 09:00~21:00 (일요일 휴무)"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray900 mb-1.5 block">매장 전화번호</label>
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              placeholder="예: 02-1234-5678 (선택)"
              value={publicPhone}
              onChange={(e) => setPublicPhone(e.target.value)}
              inputMode="tel"
            />
          </div>

          {error && <div className="text-sm text-orange font-medium">{error}</div>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full text-white text-center font-bold rounded-xl text-base disabled:opacity-60 mt-1"
            style={{ background: "#0B2540", padding: "14px 0" }}
          >
            {saving ? "저장 중..." : saved ? "저장됐어요 ✓" : "저장하기"}
          </button>
        </div>
      )}
    </div>
  );
}

function BusinessVerifySection({
  session,
  onVerified,
}: {
  session: OwnerSession;
  onVerified: () => void;
}) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessOpenDate, setBusinessOpenDate] = useState("");
  const [businessRepName, setBusinessRepName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
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
      onVerified();
      setDone(true);
    } catch {
      setError("확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (session.businessVerified || done) {
    return (
      <div>
        <div className="text-lg font-bold text-navy mb-3">🏅 사업자등록 인증</div>
        <div className="rounded-xl bg-gray100 px-4 py-4 text-sm text-gray500">
          인증 매장이에요. 고객 화면에 &ldquo;인증 매장&rdquo; 배지가 표시돼요.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-lg font-bold text-navy mb-1">🏅 사업자등록 인증</div>
      <div className="text-xs text-gray500 mb-4">
        국세청에서 즉시 확인돼요. 통과하면 고객 화면에 인증 배지가 붙어요.
      </div>
      <div className="flex flex-col gap-3.5">
        <div>
          <label className="text-sm font-bold text-gray900 mb-1.5 block">사업자등록번호</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
            style={{ height: "52px" }}
            placeholder="숫자 10자리"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray900 mb-1.5 block">개업일자</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
            style={{ height: "52px" }}
            placeholder="20200101"
            value={businessOpenDate}
            onChange={(e) => setBusinessOpenDate(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray900 mb-1.5 block">대표자 성함</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
            style={{ height: "52px" }}
            placeholder="사업자등록증에 적힌 이름"
            value={businessRepName}
            onChange={(e) => setBusinessRepName(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full text-white text-center font-bold rounded-xl text-base disabled:opacity-60 mt-1"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "14px 0" }}
        >
          {submitting ? "확인 중..." : "인증하기"}
        </button>
      </div>
    </div>
  );
}
