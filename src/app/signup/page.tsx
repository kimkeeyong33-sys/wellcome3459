"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockCategories, mockRegions, categoryIcons, categoryColors } from "@/lib/mockData";
import { subscribeToPush } from "@/lib/pushClient";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const refCode = searchParams.get("ref"); // 추천인의 member id (점핑파트너 트래킹용)
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);
  const [categories, setCategories] = useState<string[]>(["농수축산물", "냉동냉장식품"]);
  const [regions, setRegions] = useState<string[]>(["서울"]);
  const [isBusiness, setIsBusiness] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "granted" | "denied" | "unsupported">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const sendOtp = async () => {
    setError(null);
    if (!/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
      setError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      // Supabase 미설정 환경(로컬 데모)에서는 인증 자체를 생략합니다.
      setOtpSent(true);
      setOtpVerified(true);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+82${phone.replace(/^0/, "").replace(/-/g, "")}`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setOtpSent(true);
    setOtpVerified(false);
    setResendCooldown(60);
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtp("");
    await sendOtp();
  };

  const verifyOtpCode = async () => {
    setError(null);
    if (!otp) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    if (!supabase) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+82${phone.replace(/^0/, "").replace(/-/g, "")}`,
        token: otp,
        type: "sms",
      });
      if (error || !data.user) {
        setError(error?.message ?? "인증번호가 올바르지 않아요. 다시 확인해주세요.");
        return;
      }
      setVerifiedUserId(data.user.id);
      setOtpVerified(true);
    } finally {
      setVerifying(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (isSupabaseConfigured && !otpVerified) {
      setError("휴대폰 인증을 먼저 완료해주세요.");
      return;
    }
    if (!agreed) {
      setError("기기 알림 수신 동의는 필수예요.");
      return;
    }
    if (categories.length === 0 || regions.length === 0) {
      setError("관심 카테고리와 지역을 최소 1개씩 선택해주세요.");
      return;
    }
    setSubmitting(true);

    // 알라미와 동일하게, 카카오톡 같은 중간 채널 없이 기기에 직접 알림을
    // 띄우기 위해 브라우저 알림 권한 + 푸시 구독을 먼저 받습니다.
    const pushResult = await subscribeToPush();
    if (pushResult.status === "denied") setPushStatus("denied");
    else if (pushResult.status === "unsupported") setPushStatus("unsupported");
    else setPushStatus("granted");

    if (!isSupabaseConfigured || !supabase) {
      // 데모 모드: 실제 저장 없이 다음 화면으로 이동
      await new Promise((r) => setTimeout(r, 500));
      setSubmitting(false);
      router.push(returnTo || "/deals");
      return;
    }

    try {
      const userId = verifiedUserId;
      if (!userId) {
        setError("휴대폰 인증을 먼저 완료해주세요.");
        setSubmitting(false);
        return;
      }

      await supabase.from("members").upsert({
        id: userId,
        phone,
        is_business: isBusiness,
        ...(refCode && refCode !== userId ? { referred_by: refCode } : {}),
      });

      const { data: catRows } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", categories);
      const { data: regRows } = await supabase
        .from("regions")
        .select("id, name")
        .in("name", regions);

      if (catRows?.length) {
        await supabase.from("member_categories").upsert(
          catRows.map((c) => ({ member_id: userId, category_id: c.id }))
        );
      }
      if (regRows?.length) {
        await supabase.from("member_regions").upsert(
          regRows.map((r) => ({ member_id: userId, region_id: r.id }))
        );
      }

      if (pushResult.status === "subscribed" && pushResult.subscription.endpoint) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: userId, subscription: pushResult.subscription }),
        });
      }

      router.push(returnTo || "/deals");
    } catch {
      setError("가입 처리 중 오류가 발생했습니다.");
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
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="bg-white rounded-lg px-3.5 py-2.5 inline-block">
            <img src="/images/logo.png" alt="덤핑점핑" className="h-8 w-auto" />
          </Link>
          <span className="text-white/50 text-[11px] tracking-wide">Powered by JumpingBid</span>
        </div>
        <div className="text-xs font-bold tracking-widest" style={{ color: "#FFD166" }}>
          30초면 끝나요
        </div>
        <h1 className="font-display text-2xl mt-2 leading-snug">
          알림 받을 카테고리와
          <br />
          지역만 골라주세요
        </h1>
        <p className="text-white/80 text-sm mt-2">
          이름·사업자등록증은 나중에 점핑매니저가 확인해요.
        </p>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-6" style={{ paddingBottom: "108px" }}>
        <div>
          <label className="text-base font-bold text-navy mb-2 flex items-center gap-1.5">
            관심 카테고리
            <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
              복수선택
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {mockCategories.map((c) => {
              const picked = categories.includes(c);
              const color = categoryColors[c];
              return (
                <button
                  key={c}
                  onClick={() => toggle(categories, setCategories, c)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border py-3.5 px-1 text-center"
                  style={
                    picked
                      ? { background: color.solid, borderColor: color.solid, color: "#fff" }
                      : { background: color.bg, borderColor: color.bg, color: color.text }
                  }
                >
                  <span className="text-2xl leading-none">{categoryIcons[c]}</span>
                  <span className="text-sm font-bold leading-tight">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-base font-bold text-navy mb-2 flex items-center gap-1.5">
            관심 지역
            <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
              복수선택
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {mockRegions.map((r) => (
              <button
                key={r}
                onClick={() => toggle(regions, setRegions, r)}
                className={`text-sm px-4 py-2.5 rounded-full border-2 font-bold ${
                  regions.includes(r)
                    ? "bg-navy text-white border-navy"
                    : "border-gray200 text-gray500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsBusiness(!isBusiness)}
          className="flex items-center justify-between border-2 border-gray200 rounded-xl px-4 text-left"
          style={{ minHeight: "64px" }}
        >
          <div>
            <div className="text-base font-medium text-gray900">사업자 회원이에요</div>
            <div className="text-xs text-gray500 mt-0.5">선택 · 점핑매니저 검증에 활용</div>
          </div>
          <div
            className={`w-12 h-7 rounded-full relative transition-colors flex-shrink-0 ${
              isBusiness ? "bg-orange" : "bg-gray200"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                isBusiness ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>

        <div>
          <label className="text-base font-bold text-navy mb-2 block">
            알림 받을 번호
            <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full ml-1.5">
              마지막 단계
            </span>
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
              style={{ height: "56px" }}
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={otpSent}
            />
            {!otpSent && (
              <button
                onClick={sendOtp}
                className="text-white font-bold rounded-xl text-base px-5 whitespace-nowrap flex-shrink-0"
                style={{ background: "#F2891F" }}
              >
                인증받기
              </button>
            )}
          </div>

          {/* 실제 인증 진행 중 (인증번호 입력 대기) */}
          {otpSent && isSupabaseConfigured && !otpVerified && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-lg outline-none focus:border-orange"
                  style={{ height: "56px" }}
                  placeholder="인증번호 6자리"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                />
                <button
                  onClick={verifyOtpCode}
                  disabled={verifying}
                  className="text-white font-bold rounded-xl text-base px-5 whitespace-nowrap disabled:opacity-60 flex-shrink-0"
                  style={{ background: "#F2891F" }}
                >
                  {verifying ? "확인 중..." : "확인"}
                </button>
              </div>
              <button
                onClick={resendOtp}
                disabled={resendCooldown > 0}
                className="text-sm text-gray500 mt-2 py-1 disabled:opacity-50"
              >
                {resendCooldown > 0 ? `인증번호 재발송 (${resendCooldown}초 후 가능)` : "인증번호 재발송"}
              </button>
            </div>
          )}

          {/* 인증 완료 표시 */}
          {otpVerified && (
            <div
              className="mt-2 flex items-center gap-1.5 text-sm font-bold rounded-xl px-4"
              style={{ height: "44px", background: "#E8F8EC", color: "#1D8A44" }}
            >
              ✓ {isSupabaseConfigured ? "인증 되었습니다" : "인증 완료 (데모 모드 · 실제 인증 생략)"}
            </div>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-orange w-5 h-5 flex-shrink-0"
          />
          <span className="text-sm text-gray500 leading-relaxed">
            <b className="text-gray900">[필수]</b> 기기 알림(푸시) 수신 및{" "}
            <a href="/privacy" target="_blank" className="text-orange font-bold underline">
              개인정보 처리방침
            </a>{" "}
            동의
          </span>
        </label>

        {pushStatus === "denied" && (
          <div className="text-sm text-orange bg-dangerBg rounded-lg px-4 py-3">
            브라우저 알림이 차단돼 있어요. 주소창 왼쪽 자물쇠 아이콘에서 알림을 허용해주세요.
          </div>
        )}
        {pushStatus === "unsupported" && (
          <div className="text-sm text-gray500 bg-gray100 rounded-lg px-4 py-3 leading-relaxed">
            {typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent) ? (
              <>
                아이폰은 <b className="text-gray900">공유 버튼 → &quot;홈 화면에 추가&quot;</b>로 앱을 설치해야
                알림을 받을 수 있어요. 지금은 가입만 진행하고, 나중에 홈 화면에 추가한 뒤 다시 접속하시면
                알림이 활성화돼요.
              </>
            ) : (
              "현재 브라우저에서는 기기 알림을 지원하지 않아요. 매물은 리스트에서 계속 확인할 수 있어요."
            )}
          </div>
        )}

        {error && <div className="text-sm text-orange font-medium">{error}</div>}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
        style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)" }}
      >
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full text-white font-bold rounded-2xl text-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "처리 중..." : "알림 받기 시작"}
        </button>
      </div>
    </main>
  );
}
