"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mockCategories, mockDeals, categoryIcons, categoryColors, type Deal } from "@/lib/mockData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import SplashScreen from "@/components/SplashScreen";
import InstallAppButton from "@/components/InstallAppButton";
import KakaoChannelButton from "@/components/KakaoChannelButton";
import AdSlot from "@/components/AdSlot";
import ScrollHint from "@/components/ScrollHint";

const TODAY_BADGE_THRESHOLD = 5; // 이보다 적으면 "오늘 N건" 배너를 아예 숨김 (빈약한 숫자 노출 방지)

const EXAMPLE_DEALS = mockDeals.filter((d) => d.status !== "closed").slice(0, 3);

export default function Home() {
  const [todayCount, setTodayCount] = useState(0);
  const [preview, setPreview] = useState<Deal[]>(EXAMPLE_DEALS);
  const [isExample, setIsExample] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setIsMember(!!data.session?.user);
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return; // 데모 모드: 예시 매물 그대로 노출

    (async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [{ count }, { data: previewData }] = await Promise.all([
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("deals")
          .select(
            "id, title, deal_price, original_price, total_qty, remaining_qty, closes_at, location, images, categories(name), regions(name)"
          )
          .eq("status", "active")
          .gt("closes_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      setTodayCount(count ?? 0);
      if (previewData && previewData.length > 0) {
        setPreview(
          previewData.map((d) => ({
            id: d.id,
            title: d.title,
            category: (d.categories as unknown as { name: string } | null)?.name ?? "기타",
            region: (d.regions as unknown as { name: string } | null)?.name ?? "",
            location: d.location ?? "",
            original_price: d.original_price,
            deal_price: d.deal_price,
            total_qty: d.total_qty,
            remaining_qty: d.remaining_qty,
            closes_at: d.closes_at,
            images: d.images ?? [],
          }))
        );
        setIsExample(false);
      }
      // 실제 매물이 아직 없으면 예시(EXAMPLE_DEALS)를 그대로 보여줘서
      // "이런 특가 알림이 온다"는 감을 주고, 빈 화면으로 밋밋해지는 걸 막습니다.
    })();
  }, []);

  return (
    <SplashScreen>
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-6 pb-7 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="bg-white rounded-xl px-3 py-2 inline-block">
            <img src="/images/logo.png" alt="덤핑점핑" className="h-10 w-auto" />
          </div>
          <span className="text-white/70 text-sm tracking-wide self-end mb-1">
            Powered by JumpX
          </span>
        </div>

        {/* 신뢰 지표 — 실제 IR 확인 수치만 표기 */}
        <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 mb-4">
          <span style={{ color: "#5EEAD4" }}>✔</span>
          <span className="text-xs font-bold text-white/90">전국 B2B 사업자 830명 이용 중</span>
        </div>

        <h1 className="font-display text-3xl leading-snug drop-shadow-sm">
          <span style={{ color: "#F2891F" }}>덤핑재고,</span> 남보다 먼저 잡으세요.
        </h1>
        <p className="text-white/85 text-base mt-4 leading-relaxed">
          전국의 임박·과잉·폐업·재고처분 매물을 찾아 원하는 상품이 나오면 가장 먼저 알려드립니다.
        </p>

        {/* 긴급성 — 실제 오늘 등록 건수가 일정 수준 이상일 때만 노출 (빈약한 숫자 노출 방지) */}
        {todayCount >= TODAY_BADGE_THRESHOLD && (
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold px-3 py-2 rounded-full"
            style={{ background: "rgba(242,137,31,0.18)", color: "#FBB454" }}
          >
            🔥 오늘 등록된 덤핑 매물 {todayCount}건 · 지금 확인하기 →
          </Link>
        )}

        <ScrollHint />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-2.5">
        <InstallAppButton />
        <KakaoChannelButton />
      </div>

      <div className="px-5 pt-5">
        <div className="text-lg font-bold text-navy mb-3.5">어떤 재고를 찾고 계세요?</div>
        <div className="grid grid-cols-3 gap-2.5">
          {/* 카드 배경/텍스트는 통일(white + navy)하고, 카테고리 구분은 아이콘 배지 색상만으로
              — 파스텔 랜덤 배경이 B2C 잡화몰처럼 보이는 것을 방지 */}
          {mockCategories.map((c) => {
            const color = categoryColors[c];
            return (
              <Link
                key={c}
                href={`/deals?category=${encodeURIComponent(c)}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-1.5 text-center bg-white border border-gray200 transition-transform active:scale-95"
                style={{ minHeight: "92px" }}
              >
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full text-lg"
                  style={{ background: color.bg }}
                >
                  {categoryIcons[c]}
                </span>
                <span className="text-sm font-bold leading-tight text-navy">{c}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6">
        <AdSlot />
      </div>

      {/* 매물 예시 — 실제 매물이 있으면 실제로, 없으면 예시로 "이런 특가가 온다"는 감을 줌 */}
      {preview.length > 0 && (
        <div className="px-5 pt-8">
          <div className="flex items-center gap-1.5 mb-3.5">
            <div className="text-base font-bold text-navy">
              {isExample ? "가입하면 이런 특가 알림이 와요" : "오늘 이런 매물이 올라왔어요"}
            </div>
            {isExample && (
              <span className="text-xs font-bold text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
                예시
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {preview.map((d) => {
              const color = categoryColors[d.category] ?? categoryColors["기타"];
              const discountPct = d.original_price
                ? Math.round(((d.original_price - d.deal_price) / d.original_price) * 100)
                : 0;
              return (
                <Link
                  key={d.id}
                  href={isExample ? "/signup" : `/deals/${d.id}`}
                  className="relative flex items-center gap-3 rounded-2xl border border-gray200 px-3.5 py-3 overflow-hidden active:scale-[0.98] transition-transform"
                >
                  {discountPct > 0 && (
                    <div
                      className="absolute top-0 right-0 text-sm font-black text-white px-3 py-1.5 rounded-bl-2xl"
                      style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)" }}
                    >
                      -{discountPct}%
                    </div>
                  )}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: color.bg }}
                  >
                    {categoryIcons[d.category] ?? "🗂️"}
                  </div>
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="text-sm font-bold text-navy truncate">{d.title}</div>
                    <div className="text-xs text-gray500 mt-0.5">
                      {d.category} · {d.location}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-lg font-black" style={{ color: color.text }}>
                        {formatPrice(d.deal_price)}
                      </span>
                      <span className="text-xs text-gray500 line-through">
                        {formatPrice(d.original_price)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {isExample && (
            <p className="text-xs text-gray500 mt-2.5 text-center leading-relaxed">
              지금 가입하면 이런 특가를 실제로 가장 먼저 알려드려요 🔔
            </p>
          )}
        </div>
      )}

      {/* 보조 CTA — 스크롤 영역 안, 메인 CTA는 하단에 고정.
          위계: 둘러보기(텍스트 링크) < 정보성(고스트 pill) < 구매 등록(아웃라인) < 판매 등록(틴트+강조)
          — 판매 등록(공급 유입)이 플랫폼 성립의 병목이라 시각적으로 가장 강조. */}
      <div className="mt-9 px-5 flex flex-col gap-3" style={{ paddingBottom: "108px" }}>
        <Link
          href="/deals"
          className="text-center text-sm font-bold text-gray500 underline underline-offset-4"
        >
          오늘 등록된 매물 전체 보기 →
        </Link>

        <Link
          href="/sell"
          className="flex items-center justify-between rounded-2xl mt-1"
          style={{ background: "rgba(242,137,31,0.10)", border: "2px solid #F2891F", padding: "16px 20px" }}
        >
          <div>
            <div className="text-base font-black text-navy">📦 재고가 남으셨나요?</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: "#D9531E" }}>
              판매 등록은 무료 · 지금 등록하기
            </div>
          </div>
          <span className="text-xl" style={{ color: "#F2891F" }}>→</span>
        </Link>

        <Link
          href="/buy"
          className="flex items-center justify-between rounded-2xl bg-white border border-gray200"
          style={{ padding: "14px 20px" }}
        >
          <div>
            <div className="text-sm font-bold text-navy">🔍 이런 재고 찾습니다</div>
            <div className="text-xs text-gray500 mt-0.5">구매 희망 등록 →</div>
          </div>
        </Link>

        <div className="flex items-center justify-center gap-4 mt-2 pt-4" style={{ borderTop: "1px solid #EEF0F2" }}>
          <Link href="/support" className="flex items-center gap-1 text-xs font-bold text-gray500">
            🏛️ 정부지원금
          </Link>
          <span className="text-gray200">|</span>
          <Link href="/logistics" className="flex items-center gap-1 text-xs font-bold text-gray500">
            🚚 점핑전국물류
          </Link>
        </div>
      </div>

      {/* 메인 CTA — 항상 화면 하단에 고정 */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
        style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)", bottom: "64px" }}
      >
        {isMember ? (
          <Link
            href="/mypage"
            className="block text-center font-bold rounded-2xl"
            style={{
              background: "#E8F8EC",
              border: "2px solid #34C471",
              color: "#1D8A44",
              padding: "18px 0",
              fontSize: "19px",
            }}
          >
            ✓ 덤핑 알림받는 중
          </Link>
        ) : (
          <Link
            href="/signup"
            className="block text-white text-center font-bold rounded-2xl shadow-lg"
            style={{
              background: "linear-gradient(135deg, #D9531E, #F2891F)",
              padding: "20px 0",
              fontSize: "19px",
              boxShadow: "0 10px 24px rgba(217,83,30,0.35)",
            }}
          >
            🔔 무료 알림받기
          </Link>
        )}
      </div>
    </main>
    </SplashScreen>
  );
}
