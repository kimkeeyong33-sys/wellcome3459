"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockDeals, categoryIcons, categoryColors, type Deal } from "@/lib/mockData";
import CountdownBadge from "@/components/CountdownBadge";
import { formatPrice, percentOff } from "@/lib/format";

export default function DealDetailPage() {
  return (
    <Suspense fallback={null}>
      <DealDetailPageInner />
    </Suspense>
  );
}

function DealDetailPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [deal, setDeal] = useState<Deal>(
    mockDeals.find((d) => d.id === params.id) ?? mockDeals[0]
  );
  const [interested, setInterested] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: deal.title, text: `${deal.title} · ${formatPrice(deal.deal_price)}`, url });
      } catch {
        // 사용자가 공유를 취소한 경우 — 무시
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패 — 무시
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    (async () => {
      const { data } = await supabase
        .from("deals")
        .select(
          "id, title, deal_price, original_price, total_qty, remaining_qty, closes_at, location, images, video_url, description, status, categories(name), regions(name)"
        )
        .eq("id", params.id)
        .single();

      if (data) {
        setDeal({
          id: data.id,
          title: data.title,
          category: (data.categories as unknown as { name: string } | null)?.name ?? "기타",
          region: (data.regions as unknown as { name: string } | null)?.name ?? "",
          location: data.location ?? "",
          original_price: data.original_price,
          deal_price: data.deal_price,
          total_qty: data.total_qty,
          remaining_qty: data.remaining_qty,
          closes_at: data.closes_at,
          images: data.images ?? [],
          video_url: data.video_url ?? null,
          description: data.description ?? "",
          status: data.status ?? "active",
        });
      }
    })();
  }, [params.id]);

  const images = deal.images ?? [];
  const heroImage = activeImage ?? images[0];

  const remainPct = Math.round((deal.remaining_qty / deal.total_qty) * 100);
  const color = categoryColors[deal.category] ?? categoryColors["기타"];

  const handleInterest = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // 데모 모드에서도 실제와 동일한 원클릭 흐름을 보여줍니다.
      setShowQuickForm(true);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      // 회원가입 화면으로 보내는 대신, 전화번호 한 줄만 받는 인라인 폼을 엽니다.
      // (회원가입·인증 없이도 리드가 즉시 점핑매니저에게 전달됩니다.)
      setShowQuickForm(true);
      return;
    }

    const { error } = await supabase.from("interests").upsert({
      deal_id: deal.id,
      member_id: userData.user.id,
    });
    if (!error) setInterested(true);
  };

  const submitQuickInterest = async () => {
    setQuickError(null);
    const digits = quickPhone.replace(/[^0-9]/g, "");
    if (digits.length < 9) {
      setQuickError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    setQuickSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const res = await fetch("/api/quick-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: deal.id, phone: digits }),
        });
        if (!res.ok) throw new Error();
      }
      setInterested(true);
      setShowQuickForm(false);
    } catch {
      setQuickError("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("autoInterest") === "1") {
      handleInterest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="h-[260px] relative flex flex-col justify-between p-5 overflow-hidden"
        style={
          heroImage
            ? {}
            : { background: `linear-gradient(135deg, ${color.solid}, #0B2540)` }
        }
      >
        {heroImage && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 w-full h-full"
            aria-label="사진 크게 보기"
          >
            <img
              src={heroImage}
              alt={deal.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </button>
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)" }}
        />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="bg-white rounded-lg px-3.5 py-2.5 inline-block flex-shrink-0">
              <img src="/images/logo.png" alt="덤핑점핑" className="h-8 w-auto" />
            </Link>
            <span className="text-white/70 text-sm tracking-wide truncate">Powered by JumpX</span>
          </div>
          {remainPct <= 30 && (
            <div
              className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{ background: "#F2891F", color: "#fff" }}
            >
              🔥 소진임박 · {deal.remaining_qty}개 남음
            </div>
          )}
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-full mb-2.5">
            <span className="text-sm">{categoryIcons[deal.category] ?? "🗂️"}</span>
            {deal.category}
          </div>
          {heroImage && (
            <div className="inline-flex ml-2 items-center gap-1 text-xs font-bold text-white bg-black/40 px-2.5 py-1 rounded-full mb-2.5">
              🔍 확대
            </div>
          )}
          <h1 className="font-display text-white text-2xl">{deal.title}</h1>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(url)}
              className="rounded-lg overflow-hidden flex-shrink-0"
              style={{
                width: "56px",
                height: "56px",
                border: (activeImage ?? images[0]) === url ? `2px solid ${color.solid}` : "2px solid transparent",
              }}
            >
              <img src={url} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 p-5 flex flex-col gap-4" style={{ paddingBottom: "24px" }}>
        {deal.video_url && (
          <video
            src={deal.video_url}
            controls
            playsInline
            className="w-full rounded-2xl bg-black"
            style={{ maxHeight: "320px" }}
          />
        )}

        {deal.status === "closed" ? (
          <div className="bg-gray100 rounded-2xl px-4 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray500">이 매물은 마감됐어요</span>
            <span className="text-sm text-gray500">
              {new Date(deal.closes_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
            </span>
          </div>
        ) : (
          <CountdownBadge closesAt={deal.closes_at} size="lg" />
        )}

        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-black" style={{ color: color.text }}>
            {formatPrice(deal.deal_price)}
          </span>
          <span className="text-base text-gray500 line-through font-semibold">
            {formatPrice(deal.original_price)}
          </span>
          <span
            className="text-sm font-bold px-2 py-1 rounded-md"
            style={{ background: color.bg, color: color.text }}
          >
            -{percentOff(deal.original_price, deal.deal_price)}%
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="ml-auto flex items-center gap-1 text-xs font-bold text-gray500 border border-gray200 rounded-full px-3 py-1.5"
          >
            {shareCopied ? "링크 복사됨 ✓" : "공유 ↗"}
          </button>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray500 mb-1.5">
            <span>잔여 수량</span>
            <span>
              <b style={{ color: color.text }}>{deal.remaining_qty}</b> / {deal.total_qty}개
            </span>
          </div>
          <div className="h-2.5 bg-gray200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${remainPct}%`, background: color.solid }}
            />
          </div>
        </div>

        <div className="text-sm text-gray500 border-t border-gray200 pt-4 mt-1">
          <div className="flex justify-between py-1.5">
            <span>지역</span>
            <span className="text-gray900 font-medium">{deal.location}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>카테고리</span>
            <span className="text-gray900 font-medium">{deal.category}</span>
          </div>
        </div>

        {deal.description && (
          <div className="border-t border-gray200 pt-4">
            <div className="text-sm font-bold text-navy mb-2">상세 설명</div>
            <p className="text-sm text-gray500 leading-relaxed whitespace-pre-line">
              {deal.description}
            </p>
          </div>
        )}
      </div>

      {deal.status === "closed" ? (
        <div className="p-5 pt-1">
          <div className="bg-gray100 rounded-2xl px-4 py-4 text-center">
            <div className="text-sm font-bold text-gray900 mb-1">이미 마감된 매물이에요</div>
            <p className="text-sm text-gray500 mb-3">
              비슷한 매물이 또 나올 때 가장 먼저 알려드릴게요.
            </p>
            <Link
              href="/signup"
              className="inline-block text-white text-center font-bold rounded-xl text-sm px-6"
              style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "12px 24px" }}
            >
              덤핑정보 알림 받기
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 pt-1" style={{ paddingBottom: "116px" }}>
            <div className="bg-gray100 rounded-2xl p-3 flex items-center gap-3.5">
              <img
                src="/images/manager.png"
                alt="점핑매니저"
                className="w-20 h-20 rounded-xl object-contain bg-white flex-shrink-0"
              />
              <div>
                <p className="text-base font-bold text-navy leading-snug">
                  점핑매니저가 바로 연락드립니다.
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-full"
                    style={{ background: "#E8F8EC", color: "#1D8A44" }}
                  >
                    ✓ 검증된 매니저
                  </span>
                  <span className="text-[11px] font-bold text-gray500 px-2 py-1 rounded-full bg-white">
                    당일 연락 원칙
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
            style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)", bottom: "64px" }}
          >
            {showQuickForm && !interested ? (
              <div className="border-2 border-gray200 rounded-2xl p-4">
                <div className="text-sm font-bold text-navy mb-1">번호만 남기면 바로 연락드려요</div>
                <p className="text-xs text-gray500 mb-3">
                  회원가입 없이도 점핑매니저가 확인 후 연락드립니다. 알림을 계속 받고 싶으시면 나중에
                  가입하셔도 돼요.
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
                    style={{ height: "48px" }}
                  />
                  <button
                    onClick={submitQuickInterest}
                    disabled={quickSubmitting}
                    className="text-white font-bold rounded-xl px-5 whitespace-nowrap flex-shrink-0 disabled:opacity-60"
                    style={{ background: "#F2891F" }}
                  >
                    {quickSubmitting ? "전송 중..." : "전달하기"}
                  </button>
                </div>
                {quickError && <div className="text-xs text-orange font-medium mt-2">{quickError}</div>}
                <Link
                  href={`/signup?returnTo=${encodeURIComponent(`/deals/${deal.id}?autoInterest=1`)}`}
                  className="block text-center text-xs text-gray500 underline mt-3"
                >
                  정식으로 가입하고 알림도 계속 받을래요 →
                </Link>
              </div>
            ) : (
              <button
                onClick={handleInterest}
                disabled={interested}
                className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
                style={{
                  background: interested ? "#8A8A82" : "linear-gradient(135deg, #D9531E, #F2891F)",
                  padding: "18px 0",
                }}
              >
                {interested ? "점핑매니저에게 전달됐어요" : "관심있어요 · 점핑매니저 연결"}
              </button>
            )}
          </div>
        </>
      )}

      {lightboxOpen && heroImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white text-2xl w-10 h-10 flex items-center justify-center"
            aria-label="닫기"
          >
            ×
          </button>
          <img
            src={heroImage}
            alt={deal.title}
            className="max-w-full max-h-[70vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="flex gap-2 mt-5 overflow-x-auto px-5" onClick={(e) => e.stopPropagation()}>
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(url)}
                  className="rounded-lg overflow-hidden flex-shrink-0"
                  style={{
                    width: "48px",
                    height: "48px",
                    border: (activeImage ?? images[0]) === url ? "2px solid #F2891F" : "2px solid transparent",
                    opacity: (activeImage ?? images[0]) === url ? 1 : 0.5,
                  }}
                >
                  <img src={url} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
