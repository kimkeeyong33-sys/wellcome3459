"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockAuctions, categoryIcons, type Auction } from "@/lib/mockData";
import { computeAuctionPrice } from "@/lib/auction";
import CountdownBadge from "@/components/CountdownBadge";
import AuctionPrice from "@/components/AuctionPrice";

export default function AuctionDetailPage() {
  return (
    <Suspense fallback={null}>
      <AuctionDetailPageInner />
    </Suspense>
  );
}

function AuctionDetailPageInner() {
  const params = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction>(
    mockAuctions.find((a) => a.id === params.id) ?? mockAuctions[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    (async () => {
      const { data } = await supabase
        .from("auctions")
        .select(
          "id, title, start_price, floor_price, price_step, drop_interval_sec, starts_at, ends_at, total_qty, remaining_qty, location, images, description, status, categories(name), regions(name)"
        )
        .eq("id", params.id)
        .single();

      if (data) {
        setAuction({
          id: data.id,
          title: data.title,
          category: (data.categories as unknown as { name: string } | null)?.name ?? "기타",
          region: (data.regions as unknown as { name: string } | null)?.name ?? "",
          location: data.location ?? "",
          start_price: data.start_price,
          floor_price: data.floor_price,
          price_step: data.price_step,
          drop_interval_sec: data.drop_interval_sec,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          total_qty: data.total_qty,
          remaining_qty: data.remaining_qty,
          images: data.images ?? [],
          description: data.description ?? "",
          status: data.status ?? "active",
        });
      }
    })();
  }, [params.id]);

  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const images = auction.images ?? [];
  const heroImage = images[0];
  const remainPct = Math.round((auction.remaining_qty / auction.total_qty) * 100);
  const soldOut = auction.remaining_qty <= 0;
  const closed = auction.status === "closed" || (now > 0 && new Date(auction.ends_at).getTime() <= now);

  const submit = async () => {
    setError(null);
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 9) {
      setError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const currentPrice = computeAuctionPrice(auction, Date.now());
      if (!isSupabaseConfigured) {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const res = await fetch(`/api/auctions/${auction.id}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: digits, quantity, price: currentPrice }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "재고가 부족해요.");
        }
      }
      setAuction((prev) => ({ ...prev, remaining_qty: Math.max(0, prev.remaining_qty - quantity) }));
      setDone(true);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="h-[220px] relative flex flex-col justify-between p-5 overflow-hidden"
        style={heroImage ? {} : { background: "linear-gradient(135deg, #6C3FC2, #3D2266)" }}
      >
        {heroImage && (
          <>
            <img src={heroImage} alt={auction.title} className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)" }}
            />
          </>
        )}

        <div className="relative z-10 flex items-center gap-2 min-w-0">
          <Link href="/" className="bg-white rounded-lg px-3.5 py-2.5 inline-block flex-shrink-0">
            <img src="/images/logo.png" alt="점핑비드" className="h-8 w-auto" />
          </Link>
          <span className="text-white/70 text-sm tracking-wide truncate">Powered by JumpingBid</span>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-full mb-2.5">
            <span className="text-sm">{categoryIcons[auction.category] ?? "🗂️"}</span>
            {auction.category} · 하향경매
          </div>
          <h1 className="font-display text-white text-2xl">{auction.title}</h1>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4" style={{ paddingBottom: "24px" }}>
        {closed ? (
          <div className="bg-gray100 rounded-2xl px-4 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray500">이 경매는 마감됐어요</span>
          </div>
        ) : (
          <CountdownBadge closesAt={auction.ends_at} size="lg" />
        )}

        <AuctionPrice auction={auction} size="lg" />

        <div>
          <div className="flex justify-between text-sm text-gray500 mb-1.5">
            <span>잔여 수량</span>
            <span>
              <b style={{ color: "#6C3FC2" }}>{auction.remaining_qty}</b> / {auction.total_qty}개
            </span>
          </div>
          <div className="h-2.5 bg-gray200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${remainPct}%`, background: "#6C3FC2" }} />
          </div>
        </div>

        <div className="text-sm text-gray500 border-t border-gray200 pt-4 mt-1">
          <div className="flex justify-between py-1.5">
            <span>지역</span>
            <span className="text-gray900 font-medium">{auction.location}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>바닥가(최저가)</span>
            <span className="text-gray900 font-medium">{auction.floor_price.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>가격 하락</span>
            <span className="text-gray900 font-medium">
              {auction.drop_interval_sec / 60}분마다 {auction.price_step.toLocaleString()}원씩
            </span>
          </div>
        </div>

        {auction.description && (
          <div className="border-t border-gray200 pt-4">
            <div className="text-sm font-bold text-navy mb-2">상세 설명</div>
            <p className="text-sm text-gray500 leading-relaxed whitespace-pre-line">{auction.description}</p>
          </div>
        )}

        <div className="bg-gray100 rounded-2xl px-4 py-3.5 text-sm text-gray500 leading-relaxed">
          💡 서두르지 않아도 괜찮아요. 다만 다른 구매자가 먼저 구매하면 그 시점에서 마감됩니다. 원하는
          가격이 되면 바로 구매하세요.
        </div>
      </div>

      {done ? (
        <div className="p-5 pt-1">
          <div className="bg-gray100 rounded-2xl px-4 py-4 text-center">
            <div className="text-sm font-bold text-gray900 mb-1">✅ 구매 신청이 접수됐어요</div>
            <p className="text-sm text-gray500">점핑매니저가 곧 연락드려 결제를 도와드릴게요.</p>
          </div>
        </div>
      ) : closed || soldOut ? (
        <div className="p-5 pt-1">
          <div className="bg-gray100 rounded-2xl px-4 py-4 text-center">
            <div className="text-sm font-bold text-gray900 mb-1">
              {soldOut ? "재고가 모두 소진됐어요" : "이미 마감된 경매예요"}
            </div>
            <Link href="/auctions" className="inline-block text-sm font-bold underline mt-2" style={{ color: "#6C3FC2" }}>
              다른 하향경매 보러가기 →
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
          style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)" }}
        >
          {showForm ? (
            <div className="border-2 border-gray200 rounded-2xl p-4">
              <div className="text-sm font-bold text-navy mb-1">지금 가격으로 구매 신청</div>
              <p className="text-xs text-gray500 mb-3">
                번호를 남기면 점핑매니저가 확인 후 바로 연락드려요. 신청 즉시 해당 수량만큼 재고가 확보돼요.
              </p>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-gray500">수량</span>
                <div className="flex items-center border-2 border-gray200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 text-lg font-bold text-gray500"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(auction.remaining_qty, q + 1))}
                    className="w-9 h-9 text-lg font-bold text-gray500"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-base outline-none"
                  style={{ height: "48px" }}
                />
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="text-white font-bold rounded-xl px-5 whitespace-nowrap flex-shrink-0 disabled:opacity-60"
                  style={{ background: "#6C3FC2" }}
                >
                  {submitting ? "전송 중..." : "구매 신청"}
                </button>
              </div>
              {error && <div className="text-xs text-orange font-medium mt-2">{error}</div>}
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-white text-center font-bold rounded-2xl text-lg"
              style={{ background: "linear-gradient(135deg, #3D2266, #6C3FC2)", padding: "18px 0" }}
            >
              지금 이 가격에 구매하기
            </button>
          )}
        </div>
      )}
    </main>
  );
}
