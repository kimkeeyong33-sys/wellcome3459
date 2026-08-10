"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  mockGroupBuys,
  mockCategories,
  mockRegions,
  categoryIcons,
  categoryColors,
  type GroupBuy,
} from "@/lib/mockData";
import { currentTierPrice, nextTier } from "@/lib/groupbuy";
import CountdownBadge from "@/components/CountdownBadge";
import { formatPrice } from "@/lib/format";

export default function GroupBuysPage() {
  return (
    <Suspense fallback={null}>
      <GroupBuysPageInner />
    </Suspense>
  );
}

function GroupBuysPageInner() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category");
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>(mockGroupBuys);
  const [activeCat, setActiveCat] = useState<string>(
    initialCat && mockCategories.includes(initialCat) ? initialCat : "전체"
  );
  const [activeRegion, setActiveRegion] = useState<string>("전체");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return; // 데모 모드: mockGroupBuys 사용

    (async () => {
      const { data, error } = await supabase
        .from("group_buys")
        .select(
          "id, title, tiers, target_qty, current_qty, deadline, location, images, description, categories(name), regions(name)"
        )
        .eq("status", "open")
        .gt("deadline", new Date().toISOString())
        .order("deadline", { ascending: true });

      if (!error && data) {
        setGroupBuys(
          data.map((g) => ({
            id: g.id,
            title: g.title,
            category: (g.categories as unknown as { name: string } | null)?.name ?? "기타",
            region: (g.regions as unknown as { name: string } | null)?.name ?? "",
            location: g.location ?? "",
            tiers: g.tiers ?? [],
            target_qty: g.target_qty,
            current_qty: g.current_qty,
            deadline: g.deadline,
            images: g.images ?? [],
            description: g.description ?? "",
          }))
        );
      }
    })();
  }, []);

  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const notExpired = groupBuys.filter((g) => new Date(g.deadline).getTime() > now);
  const byCategory = activeCat === "전체" ? notExpired : notExpired.filter((g) => g.category === activeCat);
  const filtered = activeRegion === "전체" ? byCategory : byCategory.filter((g) => g.region === activeRegion);

  return (
    <main className="flex flex-col min-h-screen">
      <div className="px-5 pt-5 pb-3 text-white" style={{ background: "linear-gradient(120deg, #0E5C4A, #17B884)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="bg-white rounded-lg px-3 py-2 inline-block">
            <img src="/images/logo.png" alt="점핑비드" className="h-8 w-auto" />
          </Link>
          <span className="text-white/70 text-sm tracking-wide">Powered by JumpingBid</span>
        </div>
        <div className="text-xs font-bold tracking-widest whitespace-nowrap" style={{ color: "#B8F5DE" }}>
          공동구매 · 함께 모일수록 저렴해져요
        </div>
        <h1 className="font-display text-2xl mt-1.5">지금 참여하면 더 싸요</h1>

        <div className="relative">
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat("전체")}
              className={`text-sm px-4 py-2.5 rounded-full font-bold whitespace-nowrap ${
                activeCat === "전체" ? "bg-white" : "text-white"
              }`}
              style={activeCat === "전체" ? { color: "#0E5C4A" } : { background: "rgba(255,255,255,0.22)" }}
            >
              전체
            </button>
            {mockCategories.map((c) => {
              const isActive = activeCat === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className="text-sm px-4 py-2.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5"
                  style={isActive ? { background: "#fff", color: "#0E5C4A" } : { background: "rgba(255,255,255,0.22)", color: "#fff" }}
                >
                  <span className="text-base">{categoryIcons[c]}</span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {["전체", ...mockRegions].map((r) => {
              const isActive = activeRegion === r;
              return (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  className={`text-sm px-3.5 py-2 rounded-full font-bold whitespace-nowrap ${
                    isActive ? "bg-white" : "text-white"
                  }`}
                  style={isActive ? { color: "#0E5C4A" } : { background: "rgba(255,255,255,0.18)" }}
                >
                  {r === "전체" ? "전 지역" : r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray100 px-4 py-3.5 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray500 text-base py-10">진행 중인 공동구매가 없어요.</div>
        )}
        {filtered.map((g) => {
          const color = categoryColors[g.category] ?? categoryColors["기타"];
          const tier = currentTierPrice(g.tiers, g.current_qty);
          const next = nextTier(g.tiers, g.current_qty);
          const goalPct = Math.min(100, Math.round((g.current_qty / g.target_qty) * 100));
          const achieved = g.current_qty >= g.target_qty;

          return (
            <Link
              key={g.id}
              href={`/groupbuys/${g.id}`}
              className="bg-white border border-gray200 rounded-2xl px-4 py-4 flex gap-3 relative overflow-hidden"
              style={{ borderLeft: "5px solid #17B884" }}
            >
              {g.images && g.images.length > 0 ? (
                <img src={g.images[0]} alt={g.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: color.bg }}
                >
                  {categoryIcons[g.category] ?? "🗂️"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full min-w-0"
                    style={{ background: color.bg, color: color.text }}
                  >
                    <span className="text-sm flex-shrink-0">{categoryIcons[g.category] ?? "🗂️"}</span>
                    <span className="truncate">{g.category}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <CountdownBadge closesAt={g.deadline} />
                  </div>
                </div>
                <div className="text-base font-bold text-gray900 mt-2">{g.title}</div>
                <div className="text-sm text-gray500 mt-1">
                  {g.current_qty}개 참여 중 · {g.location}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-black" style={{ color: "#0E5C4A" }}>
                    {formatPrice(tier.price)}
                  </span>
                  {next && (
                    <span className="text-xs font-bold" style={{ color: "#17B884" }}>
                      {next.qty - g.current_qty}개 더 모이면 {formatPrice(next.price)}
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <div className="h-[7px] bg-gray200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${goalPct}%`, background: achieved ? "#17B884" : "#FBB454" }}
                    />
                  </div>
                  <div className="text-sm font-bold mt-1.5" style={{ color: achieved ? "#17B884" : "#B8860B" }}>
                    {achieved
                      ? "✓ 목표 수량 달성 · 진행 확정"
                      : `목표까지 ${Math.max(0, g.target_qty - g.current_qty)}개 남음`}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
