"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockGroupBuys, categoryIcons, type GroupBuy } from "@/lib/mockData";
import { currentTierPrice, nextTier } from "@/lib/groupbuy";
import CountdownBadge from "@/components/CountdownBadge";
import { formatPrice } from "@/lib/format";

export default function GroupBuyDetailPage() {
  return (
    <Suspense fallback={null}>
      <GroupBuyDetailPageInner />
    </Suspense>
  );
}

function GroupBuyDetailPageInner() {
  const params = useParams<{ id: string }>();
  const [groupBuy, setGroupBuy] = useState<GroupBuy>(
    mockGroupBuys.find((g) => g.id === params.id) ?? mockGroupBuys[0]
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
        .from("group_buys")
        .select(
          "id, title, tiers, target_qty, current_qty, deadline, location, images, description, status, categories(name), regions(name)"
        )
        .eq("id", params.id)
        .single();

      if (data) {
        setGroupBuy({
          id: data.id,
          title: data.title,
          category: (data.categories as unknown as { name: string } | null)?.name ?? "기타",
          region: (data.regions as unknown as { name: string } | null)?.name ?? "",
          location: data.location ?? "",
          tiers: data.tiers ?? [],
          target_qty: data.target_qty,
          current_qty: data.current_qty,
          deadline: data.deadline,
          images: data.images ?? [],
          description: data.description ?? "",
          status: data.status ?? "open",
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

  const images = groupBuy.images ?? [];
  const heroImage = images[0];
  const tier = currentTierPrice(groupBuy.tiers, groupBuy.current_qty);
  const next = nextTier(groupBuy.tiers, groupBuy.current_qty);
  const goalPct = Math.min(100, Math.round((groupBuy.current_qty / groupBuy.target_qty) * 100));
  const achieved = groupBuy.current_qty >= groupBuy.target_qty;
  const closed =
    groupBuy.status === "success" ||
    groupBuy.status === "failed" ||
    (now > 0 && new Date(groupBuy.deadline).getTime() <= now);

  const submit = async () => {
    setError(null);
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 9) {
      setError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const res = await fetch(`/api/groupbuys/${groupBuy.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: digits, quantity }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "참여 신청에 실패했어요.");
        }
      }
      setGroupBuy((prev) => ({ ...prev, current_qty: prev.current_qty + quantity }));
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
        style={heroImage ? {} : { background: "linear-gradient(135deg, #17B884, #0E5C4A)" }}
      >
        {heroImage && (
          <>
            <img src={heroImage} alt={groupBuy.title} className="absolute inset-0 w-full h-full object-cover" />
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
            <span className="text-sm">{categoryIcons[groupBuy.category] ?? "🗂️"}</span>
            {groupBuy.category} · 공동구매
          </div>
          <h1 className="font-display text-white text-2xl">{groupBuy.title}</h1>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4" style={{ paddingBottom: "24px" }}>
        {closed ? (
          <div className="bg-gray100 rounded-2xl px-4 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray500">
              {achieved ? "목표 수량을 달성하고 마감됐어요" : "이 공동구매는 마감됐어요"}
            </span>
          </div>
        ) : (
          <CountdownBadge closesAt={groupBuy.deadline} size="lg" />
        )}

        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-black" style={{ color: "#0E5C4A" }}>
            {formatPrice(tier.price)}
          </span>
          <span className="text-sm text-gray500">현재 참여 수량 기준 단가</span>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray500 mb-1.5">
            <span>목표 달성률</span>
            <span>
              <b style={{ color: "#0E5C4A" }}>{groupBuy.current_qty}</b> / {groupBuy.target_qty}개(목표)
            </span>
          </div>
          <div className="h-2.5 bg-gray200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${goalPct}%`, background: achieved ? "#17B884" : "#FBB454" }}
            />
          </div>
          <div className="text-sm font-bold mt-1.5" style={{ color: achieved ? "#17B884" : "#B8860B" }}>
            {achieved ? "✓ 목표 수량 달성 · 진행 확정" : `목표까지 ${Math.max(0, groupBuy.target_qty - groupBuy.current_qty)}개 남음`}
          </div>
        </div>

        <div className="border-t border-gray200 pt-4">
          <div className="text-sm font-bold text-navy mb-2.5">참여 수량별 단가</div>
          <div className="flex flex-col gap-1.5">
            {groupBuy.tiers.map((t, i) => {
              const isCurrent = t.qty === tier.qty;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                  style={isCurrent ? { background: "#E8F8EC", border: "1.5px solid #17B884" } : { background: "#F5F6F8" }}
                >
                  <span className="text-sm font-bold" style={{ color: isCurrent ? "#0E5C4A" : "#6B7480" }}>
                    {t.qty}개 이상{isCurrent ? " · 현재 단계" : ""}
                  </span>
                  <span className="text-sm font-black" style={{ color: isCurrent ? "#0E5C4A" : "#1A1F26" }}>
                    {formatPrice(t.price)}
                  </span>
                </div>
              );
            })}
          </div>
          {next && (
            <p className="text-xs text-gray500 mt-2.5">
              {next.qty - groupBuy.current_qty}개만 더 모이면 개당 {formatPrice(next.price)}으로 내려가요.
            </p>
          )}
        </div>

        <div className="text-sm text-gray500 border-t border-gray200 pt-4">
          <div className="flex justify-between py-1.5">
            <span>지역</span>
            <span className="text-gray900 font-medium">{groupBuy.location}</span>
          </div>
        </div>

        {groupBuy.description && (
          <div className="border-t border-gray200 pt-4">
            <div className="text-sm font-bold text-navy mb-2">상세 설명</div>
            <p className="text-sm text-gray500 leading-relaxed whitespace-pre-line">{groupBuy.description}</p>
          </div>
        )}

        <div className="bg-gray100 rounded-2xl px-4 py-3.5 text-sm text-gray500 leading-relaxed">
          💡 목표 수량 미달 시 전원 자동 취소되며 결제 부담이 없어요. 목표를 달성하면 최종 확정 단가로
          점핑매니저가 연락드려 결제를 도와드립니다.
        </div>
      </div>

      {done ? (
        <div className="p-5 pt-1">
          <div className="bg-gray100 rounded-2xl px-4 py-4 text-center">
            <div className="text-sm font-bold text-gray900 mb-1">✅ 참여 신청이 접수됐어요</div>
            <p className="text-sm text-gray500">목표 수량이 달성되면 점핑매니저가 바로 연락드려요.</p>
          </div>
        </div>
      ) : closed ? (
        <div className="p-5 pt-1">
          <div className="bg-gray100 rounded-2xl px-4 py-4 text-center">
            <Link href="/groupbuys" className="inline-block text-sm font-bold underline" style={{ color: "#0E5C4A" }}>
              다른 공동구매 보러가기 →
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
              <div className="text-sm font-bold text-navy mb-1">공동구매 참여하기</div>
              <p className="text-xs text-gray500 mb-3">
                번호와 수량을 남기면 목표 달성 시 점핑매니저가 바로 연락드려요.
              </p>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-gray500">수량</span>
                <div className="flex items-center border-2 border-gray200 rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 text-lg font-bold text-gray500">
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 text-lg font-bold text-gray500">
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
                  style={{ background: "#17B884" }}
                >
                  {submitting ? "전송 중..." : "참여 신청"}
                </button>
              </div>
              {error && <div className="text-xs text-orange font-medium mt-2">{error}</div>}
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-white text-center font-bold rounded-2xl text-lg"
              style={{ background: "linear-gradient(135deg, #0E5C4A, #17B884)", padding: "18px 0" }}
            >
              공동구매 참여하기
            </button>
          )}
        </div>
      )}
    </main>
  );
}
