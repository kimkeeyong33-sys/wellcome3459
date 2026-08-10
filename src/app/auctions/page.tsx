"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockAuctions, mockCategories, mockRegions, categoryIcons, categoryColors, type Auction } from "@/lib/mockData";
import CountdownBadge from "@/components/CountdownBadge";
import AuctionPrice from "@/components/AuctionPrice";

export default function AuctionsPage() {
  return (
    <Suspense fallback={null}>
      <AuctionsPageInner />
    </Suspense>
  );
}

function AuctionsPageInner() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category");
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [activeCat, setActiveCat] = useState<string>(
    initialCat && mockCategories.includes(initialCat) ? initialCat : "전체"
  );
  const [activeRegion, setActiveRegion] = useState<string>("전체");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return; // 데모 모드: mockAuctions 사용

    (async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select(
          "id, title, start_price, floor_price, price_step, drop_interval_sec, starts_at, ends_at, total_qty, remaining_qty, location, images, description, categories(name), regions(name)"
        )
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });

      if (!error && data) {
        setAuctions(
          data.map((a) => ({
            id: a.id,
            title: a.title,
            category: (a.categories as unknown as { name: string } | null)?.name ?? "기타",
            region: (a.regions as unknown as { name: string } | null)?.name ?? "",
            location: a.location ?? "",
            start_price: a.start_price,
            floor_price: a.floor_price,
            price_step: a.price_step,
            drop_interval_sec: a.drop_interval_sec,
            starts_at: a.starts_at,
            ends_at: a.ends_at,
            total_qty: a.total_qty,
            remaining_qty: a.remaining_qty,
            images: a.images ?? [],
            description: a.description ?? "",
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

  const notExpired = auctions.filter((a) => new Date(a.ends_at).getTime() > now && a.remaining_qty > 0);
  const byCategory = activeCat === "전체" ? notExpired : notExpired.filter((a) => a.category === activeCat);
  const filtered = activeRegion === "전체" ? byCategory : byCategory.filter((a) => a.region === activeRegion);

  return (
    <main className="flex flex-col min-h-screen">
      <div className="px-5 pt-5 pb-3 text-white" style={{ background: "linear-gradient(120deg, #3D2266, #6C3FC2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="bg-white rounded-lg px-3 py-2 inline-block">
            <img src="/images/logo.png" alt="점핑비드" className="h-8 w-auto" />
          </Link>
          <span className="text-white/70 text-sm tracking-wide">Powered by JumpingBid</span>
        </div>
        <div className="text-xs font-bold tracking-widest whitespace-nowrap" style={{ color: "#E4D4FF" }}>
          하향경매 · 시간이 지날수록 가격이 내려가요
        </div>
        <h1 className="font-display text-2xl mt-1.5">지금 이 가격, 살까요?</h1>

        <div className="relative">
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat("전체")}
              className={`text-sm px-4 py-2.5 rounded-full font-bold whitespace-nowrap ${
                activeCat === "전체" ? "bg-white" : "text-white"
              }`}
              style={activeCat === "전체" ? { color: "#3D2266" } : { background: "rgba(255,255,255,0.22)" }}
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
                  style={isActive ? { background: "#fff", color: "#3D2266" } : { background: "rgba(255,255,255,0.22)", color: "#fff" }}
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
                  style={isActive ? { color: "#3D2266" } : { background: "rgba(255,255,255,0.18)" }}
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
          <div className="text-center text-gray500 text-base py-10">진행 중인 하향경매가 없어요.</div>
        )}
        {filtered.map((a) => {
          const remainPct = Math.round((a.remaining_qty / a.total_qty) * 100);
          const color = categoryColors[a.category] ?? categoryColors["기타"];
          return (
            <Link
              key={a.id}
              href={`/auctions/${a.id}`}
              className="bg-white border border-gray200 rounded-2xl px-4 py-4 flex gap-3 relative overflow-hidden"
              style={{ borderLeft: "5px solid #6C3FC2" }}
            >
              {a.images && a.images.length > 0 ? (
                <img src={a.images[0]} alt={a.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: color.bg }}
                >
                  {categoryIcons[a.category] ?? "🗂️"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full min-w-0"
                    style={{ background: color.bg, color: color.text }}
                  >
                    <span className="text-sm flex-shrink-0">{categoryIcons[a.category] ?? "🗂️"}</span>
                    <span className="truncate">{a.category}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <CountdownBadge closesAt={a.ends_at} />
                  </div>
                </div>
                <div className="text-base font-bold text-gray900 mt-2">{a.title}</div>
                <div className="text-sm text-gray500 mt-1">
                  잔여 {a.remaining_qty}개 · {a.location}
                </div>
                <div className="mt-2">
                  <AuctionPrice auction={a} />
                </div>
                <div className="mt-2.5">
                  <div className="h-[7px] bg-gray200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${remainPct}%`, background: "#6C3FC2" }} />
                  </div>
                  <div className="text-sm font-bold mt-1.5" style={{ color: "#6C3FC2" }}>
                    재고 {remainPct}% 남음{remainPct < 30 ? " · 서두르세요" : ""}
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
