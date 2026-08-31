"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mockCategories, mockRegions, categoryIcons } from "@/lib/mockData";
import ImageUploader from "@/components/ImageUploader";
import VideoUploader from "@/components/VideoUploader";
import { formatPriceInput, parsePriceInput } from "@/lib/format";

type SellerRequest = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_phone: string;
  product_name: string;
  quantity: number;
  hope_price: number | null;
  hope_duration_hours: number | null;
  description: string | null;
  images: string[] | null;
  video_url: string | null;
  categories: { name: string } | null;
  regions: { name: string } | null;
};

type ActiveDeal = {
  id: string;
  title: string;
  deal_price: number;
  total_qty: number;
  remaining_qty: number;
  closes_at: string;
  created_at: string;
  categories: { name: string } | null;
  regions: { name: string } | null;
};

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AdminPage() {
  const [key, setKey] = useState<string | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("jumpingbid_admin_key");
    if (stored) setKey(stored);
  }, []);

  const login = () => {
    sessionStorage.setItem("jumpingbid_admin_key", input);
    setKey(input);
  };

  if (!key) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-2xl mb-4">🔒</div>
        <h1 className="font-display text-xl text-navy mb-4">관리자 비밀번호</h1>
        <input
          type="password"
          className="w-full max-w-xs border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
          style={{ height: "52px" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="비밀번호 입력"
        />
        <button
          onClick={login}
          className="w-full max-w-xs mt-3 text-white font-bold rounded-xl text-base"
          style={{ background: "#0B2540", padding: "14px 0" }}
        >
          입장
        </button>
      </main>
    );
  }

  return <AdminDashboard adminKey={key} onLogout={() => { sessionStorage.removeItem("jumpingbid_admin_key"); setKey(null); }} />;
}

type Interest = {
  id: string;
  contacted: boolean;
  outcome: "pending" | "completed" | "no_deal";
  completed_amount: number | null;
  created_at: string;
  deals: { id: string; title: string; deal_price: number } | null;
  members: { phone: string; is_business: boolean } | null;
  phone?: string; // quick_leads(비회원 원클릭 리드)는 members 없이 전화번호만 가짐
  source: "member" | "quick";
};

type BuyRequest = {
  id: string;
  product_name: string;
  quantity: string | null;
  hope_price: number | null;
  contact_phone: string;
  description: string | null;
  contacted: boolean;
  outcome: "pending" | "matched" | "no_match";
  created_at: string;
  categories: { name: string } | null;
  regions: { name: string } | null;
};

function AdminDashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [activeDeals, setActiveDeals] = useState<ActiveDeal[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormFor, setOpenFormFor] = useState<string | "new" | null>(null);
  const [authError, setAuthError] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/seller-requests", { headers: { "x-admin-key": adminKey } }).then((res) => {
        if (res.status === 401) {
          setAuthError(true);
          throw new Error("unauthorized");
        }
        return res.json();
      }),
      fetch("/api/admin/deals/manage", { headers: { "x-admin-key": adminKey } }).then((res) =>
        res.json()
      ),
      fetch("/api/admin/interests", { headers: { "x-admin-key": adminKey } }).then((res) =>
        res.json()
      ),
      fetch("/api/admin/buy-requests", { headers: { "x-admin-key": adminKey } }).then((res) =>
        res.json()
      ),
    ])
      .then(([reqData, dealData, interestData, buyData]) => {
        setRequests(reqData.items ?? []);
        setActiveDeals(dealData.items ?? []);
        setInterests(interestData.items ?? []);
        setBuyRequests(buyData.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminKey]);

  if (authError) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-orange font-bold mb-3">비밀번호가 올바르지 않아요.</p>
        <button onClick={onLogout} className="text-navy underline text-sm">
          다시 입력하기
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-6 pb-5 text-white flex items-center justify-between"
        style={{ background: "#0B2540" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="bg-white rounded-lg px-3.5 py-2.5 inline-block">
              <img src="/images/logo.png" alt="덤핑점핑" className="h-8 w-auto" />
            </Link>
            <span className="text-white/70 text-sm tracking-wide">Powered by JumpX</span>
          </div>
          <div className="text-xs font-bold tracking-widest" style={{ color: "#FFD166" }}>
            관리자
          </div>
          <h1 className="font-display text-xl mt-1">매물 관리</h1>
          {interests.filter((i) => !i.contacted).length > 0 && (
            <div className="text-xs font-bold mt-1" style={{ color: "#FF9E7A" }}>
              🔔 미연락 리드 {interests.filter((i) => !i.contacted).length}건
            </div>
          )}
        </div>
        <button onClick={onLogout} className="text-sm text-white/70 font-bold">
          로그아웃
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "오늘 등록 매물", value: activeDeals.filter((d) => isToday(d.created_at)).length },
            { label: "오늘 구매희망", value: buyRequests.filter((b) => isToday(b.created_at)).length },
            { label: "미연락 리드", value: interests.filter((i) => !i.contacted).length },
            {
              label: "마감임박(6h)",
              value: activeDeals.filter((d) => {
                const remainMs = new Date(d.closes_at).getTime() - new Date().getTime();
                return remainMs > 0 && remainMs <= 6 * 60 * 60 * 1000;
              }).length,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray200 rounded-xl px-2 py-3 text-center">
              <div className="text-lg font-black text-navy">{stat.value}</div>
              <div className="text-[11px] text-gray500 mt-0.5 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        <div className="text-sm font-bold text-gray500">
          관심 표시한 회원 ({interests.filter((i) => !i.contacted).length}건 미연락)
        </div>

        {interests.length > 0 && (
          <div className="bg-white border border-gray200 rounded-2xl px-4 py-3 flex justify-around text-center">
            <div>
              <div className="text-lg font-black text-navy">{interests.length}</div>
              <div className="text-xs text-gray500 mt-0.5">전체 리드</div>
            </div>
            <div>
              <div className="text-lg font-black" style={{ color: "#1D8A44" }}>
                {interests.filter((i) => i.outcome === "completed").length}
              </div>
              <div className="text-xs text-gray500 mt-0.5">거래 성사</div>
            </div>
            <div>
              <div className="text-lg font-black text-gray500">
                {interests.filter((i) => i.outcome === "pending").length}
              </div>
              <div className="text-xs text-gray500 mt-0.5">진행 중</div>
            </div>
            <div>
              <div className="text-lg font-black text-navy">
                {interests.filter((i) => i.outcome !== "pending").length > 0
                  ? Math.round(
                      (interests.filter((i) => i.outcome === "completed").length /
                        interests.filter((i) => i.outcome !== "pending").length) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-xs text-gray500 mt-0.5">성사율</div>
            </div>
          </div>
        )}

        {!loading && interests.length === 0 && (
          <div className="text-center text-gray500 py-6 text-sm">아직 관심 표시가 없어요.</div>
        )}
        {interests.map((i) => (
          <div
            key={i.id}
            className="bg-white border rounded-2xl px-4 py-3.5"
            style={{
              borderColor:
                i.outcome === "completed"
                  ? "#34C471"
                  : i.outcome === "no_deal"
                  ? "#E4E7EB"
                  : i.contacted
                  ? "#E4E7EB"
                  : "#F2891F",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold text-gray900 truncate">
                    {i.deals?.title ?? "삭제된 매물"}
                  </div>
                  {i.outcome === "completed" && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "#E8F8EC", color: "#1D8A44" }}
                    >
                      성사
                    </span>
                  )}
                  {i.outcome === "no_deal" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-gray100 text-gray500">
                      불발
                    </span>
                  )}
                  {i.source === "quick" && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "#FDEEE8", color: "#C2410C" }}
                    >
                      ⚡ 원클릭
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray500 mt-0.5">
                  {i.members?.phone ?? i.phone ?? "번호 없음"}
                  {i.members?.is_business && (
                    <span className="ml-1.5 text-xs font-bold text-navy">· 사업자</span>
                  )}
                </div>
                <div className="text-xs text-gray500 mt-0.5">
                  {new Date(i.created_at).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {i.outcome === "completed" && i.completed_amount && (
                    <span className="ml-1.5 font-bold" style={{ color: "#1D8A44" }}>
                      · {i.completed_amount.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/admin/interests", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                    body: JSON.stringify({ id: i.id, source: i.source, contacted: !i.contacted }),
                  });
                  load();
                }}
                className="text-xs font-bold rounded-lg px-3 py-2 flex-shrink-0"
                style={
                  i.contacted
                    ? { background: "#F5F6F8", color: "#6B7480" }
                    : { background: "#0B2540", color: "#fff" }
                }
              >
                {i.contacted ? "연락완료" : "연락하기"}
              </button>
            </div>

            {i.outcome === "pending" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    const amountStr = prompt("실제 거래 금액을 입력해주세요 (원)", String(i.deals?.deal_price ?? ""));
                    if (amountStr === null) return;
                    const amount = Number(amountStr.replace(/[^\d]/g, ""));
                    await fetch("/api/admin/interests", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                      body: JSON.stringify({ id: i.id, source: i.source, outcome: "completed", completedAmount: amount || null }),
                    });
                    load();
                  }}
                  className="flex-1 text-xs font-bold rounded-lg py-2"
                  style={{ background: "#E8F8EC", color: "#1D8A44" }}
                >
                  ✓ 거래 성사
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("이 리드를 거래 불발로 처리할까요?")) return;
                    await fetch("/api/admin/interests", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                      body: JSON.stringify({ id: i.id, source: i.source, outcome: "no_deal" }),
                    });
                    load();
                  }}
                  className="flex-1 text-xs font-bold rounded-lg py-2 bg-gray100 text-gray500"
                >
                  거래 불발
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        <button
          onClick={() => setOpenFormFor(openFormFor === "new" ? null : "new")}
          className="w-full text-white font-bold rounded-xl text-base"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "14px 0" }}
        >
          {openFormFor === "new" ? "닫기" : "+ 새 매물 직접 등록"}
        </button>
        {openFormFor === "new" && (
          <DealForm adminKey={adminKey} onDone={() => { setOpenFormFor(null); load(); }} />
        )}
      </div>

      <div className="px-5 pb-6 flex flex-col gap-3">
        <div className="text-sm font-bold text-gray500">
          진행 중인 매물 ({activeDeals.length})
        </div>
        {!loading && activeDeals.length === 0 && (
          <div className="text-center text-gray500 py-6 text-sm">진행 중인 매물이 없어요.</div>
        )}
        {activeDeals.map((d) => (
          <ActiveDealCard key={d.id} deal={d} adminKey={adminKey} onChanged={load} />
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col gap-3">
        <div className="text-sm font-bold text-gray500">
          대기 중인 판매자 신청 ({requests.length})
        </div>

        {loading && <div className="text-center text-gray500 py-8">불러오는 중...</div>}
        {!loading && requests.length === 0 && (
          <div className="text-center text-gray500 py-8 text-sm">대기 중인 신청이 없어요.</div>
        )}

        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-gray200 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray500">
              <span>{categoryIcons[r.categories?.name ?? ""] ?? "🗂️"}</span>
              {[r.categories?.name, r.regions?.name].filter(Boolean).join(" · ") || "카테고리/지역 미입력"}
            </div>
            <div className="text-base font-bold text-gray900 mt-1.5">{r.product_name}</div>
            <div className="text-sm text-gray500 mt-1">
              {[r.company_name, r.contact_name, r.contact_phone].filter(Boolean).join(" · ")}
            </div>
            <div className="text-sm text-gray500 mt-1">
              수량 {r.quantity}개
              {r.hope_price ? ` · 희망단가 ${r.hope_price.toLocaleString()}원` : ""}
              {r.hope_duration_hours
                ? ` · 희망 마감 ${
                    r.hope_duration_hours >= 24
                      ? `${Math.round(r.hope_duration_hours / 24)}일`
                      : `${r.hope_duration_hours}시간`
                  } 후`
                : " · 마감시점 협의 필요"}
            </div>
            {r.description && (
              <div className="text-sm text-gray500 mt-1 bg-gray100 rounded-lg px-3 py-2">
                {r.description}
              </div>
            )}
            {r.images && r.images.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {r.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`신청 사진 ${i + 1}`}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray200"
                  />
                ))}
              </div>
            )}
            {r.video_url && (
              <video
                src={r.video_url}
                controls
                className="w-full rounded-lg mt-2 bg-black"
                style={{ maxHeight: "180px" }}
              />
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setOpenFormFor(openFormFor === r.id ? null : r.id)}
                className="flex-1 text-navy font-bold border-2 border-navy rounded-xl text-sm"
                style={{ padding: "10px 0" }}
              >
                {openFormFor === r.id ? "닫기" : "매물로 등록하기"}
              </button>
              <button
                onClick={async () => {
                  if (!confirm("이 신청을 거절할까요?")) return;
                  await fetch("/api/admin/seller-requests", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                    body: JSON.stringify({ id: r.id, status: "rejected" }),
                  });
                  load();
                }}
                className="text-gray500 font-bold border-2 border-gray200 rounded-xl text-sm px-4"
              >
                거절
              </button>
            </div>
            {openFormFor === r.id && (
              <DealForm
                adminKey={adminKey}
                prefill={{
                  title: r.product_name,
                  category: r.categories?.name ?? mockCategories[0],
                  region: r.regions?.name ?? mockRegions[0],
                  dealPrice: r.hope_price ?? undefined,
                  totalQty: r.quantity,
                  images: r.images ?? [],
                  videoUrl: r.video_url ?? undefined,
                  description: r.description ?? "",
                  closesInHours: r.hope_duration_hours ?? undefined,
                }}
                requestId={r.id}
                onDone={() => { setOpenFormFor(null); load(); }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col gap-3">
        <div className="text-sm font-bold text-gray500">
          🔍 이런 재고 찾습니다 ({buyRequests.filter((b) => !b.contacted).length}건 미연락)
        </div>

        {!loading && buyRequests.length === 0 && (
          <div className="text-center text-gray500 py-6 text-sm">등록된 구매 희망이 없어요.</div>
        )}

        {buyRequests.map((b) => (
          <div key={b.id} className="bg-white border border-gray200 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray500">
                <span>{categoryIcons[b.categories?.name ?? ""] ?? "🗂️"}</span>
                {b.categories?.name ?? "카테고리 미지정"} · {b.regions?.name ?? "전국 가능"}
              </div>
              {b.outcome === "matched" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#E8F8EC", color: "#1D8A44" }}>
                  매칭 완료
                </span>
              )}
              {b.outcome === "no_match" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray100 text-gray500">
                  매칭 불발
                </span>
              )}
            </div>
            <div className="text-base font-bold text-gray900 mt-1.5">{b.product_name}</div>
            <div className="text-sm text-gray500 mt-1">
              {b.contact_phone}
              {b.quantity ? ` · 희망수량 ${b.quantity}` : ""}
              {b.hope_price ? ` · 희망가 ${b.hope_price.toLocaleString()}원 이하` : ""}
            </div>
            {b.description && (
              <div className="text-sm text-gray500 mt-1 bg-gray100 rounded-lg px-3 py-2">
                {b.description}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  await fetch("/api/admin/buy-requests", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                    body: JSON.stringify({ id: b.id, contacted: !b.contacted }),
                  });
                  load();
                }}
                className="flex-1 text-xs font-bold rounded-lg py-2"
                style={
                  b.contacted
                    ? { background: "#F5F6F8", color: "#6B7480" }
                    : { background: "#FDEEE8", color: "#C2410C" }
                }
              >
                {b.contacted ? "연락 완료" : "아직 연락 전"}
              </button>
              {b.outcome === "pending" && (
                <>
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/buy-requests", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                        body: JSON.stringify({ id: b.id, outcome: "matched" }),
                      });
                      load();
                    }}
                    className="flex-1 text-xs font-bold rounded-lg py-2"
                    style={{ background: "#E8F8EC", color: "#1D8A44" }}
                  >
                    매칭 완료
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("매칭 불발로 처리할까요?")) return;
                      await fetch("/api/admin/buy-requests", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                        body: JSON.stringify({ id: b.id, outcome: "no_match" }),
                      });
                      load();
                    }}
                    className="flex-1 text-xs font-bold rounded-lg py-2 bg-gray100 text-gray500"
                  >
                    매칭 불발
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function ActiveDealCard({
  deal,
  adminKey,
  onChanged,
}: {
  deal: ActiveDeal;
  adminKey: string;
  onChanged: () => void;
}) {
  const [remainingQty, setRemainingQty] = useState(String(deal.remaining_qty));
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch("/api/admin/deals/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id: deal.id, ...body }),
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const extendHours = (hours: number) => {
    const newClosesAt = new Date(new Date(deal.closes_at).getTime() + hours * 3600 * 1000).toISOString();
    patch({ closesAt: newClosesAt });
  };

  return (
    <div className="bg-white border border-gray200 rounded-2xl px-4 py-4">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray500">
        <span>{categoryIcons[deal.categories?.name ?? ""] ?? "🗂️"}</span>
        {deal.categories?.name} · {deal.regions?.name}
      </div>
      <div className="text-base font-bold text-gray900 mt-1.5">{deal.title}</div>
      <div className="text-sm text-gray500 mt-1">
        {deal.deal_price.toLocaleString()}원 · 마감{" "}
        {new Date(deal.closes_at).toLocaleString("ko-KR", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <label className="text-xs font-bold text-gray500">재고</label>
        <input
          type="number"
          className="w-20 border-2 border-gray200 rounded-lg px-2 py-1.5 text-sm"
          value={remainingQty}
          onChange={(e) => setRemainingQty(e.target.value)}
        />
        <span className="text-xs text-gray500">/ {deal.total_qty}개</span>
        <button
          onClick={() => patch({ remainingQty: Number(remainingQty) })}
          disabled={saving}
          className="ml-auto text-xs font-bold text-white bg-navy rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          저장
        </button>
      </div>

      <div className="flex gap-2 mt-2.5">
        <button
          onClick={() => extendHours(24)}
          disabled={saving}
          className="flex-1 text-xs font-bold text-navy border-2 border-gray200 rounded-lg py-2"
        >
          +24시간 연장
        </button>
        <button
          onClick={() => confirm("이 매물을 지금 조기 마감할까요?") && patch({ status: "closed" })}
          disabled={saving}
          className="flex-1 text-xs font-bold text-orange border-2 border-orange rounded-lg py-2"
        >
          조기 마감
        </button>
      </div>
    </div>
  );
}

function DealForm({
  adminKey,
  prefill,
  requestId,
  onDone,
}: {
  adminKey: string;
  prefill?: {
    title?: string;
    category?: string;
    region?: string;
    dealPrice?: number;
    totalQty?: number;
    images?: string[];
    videoUrl?: string;
    description?: string;
    closesInHours?: number;
  };
  requestId?: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [category, setCategory] = useState(prefill?.category ?? mockCategories[0]);
  const [region, setRegion] = useState(prefill?.region ?? mockRegions[0]);
  const [originalPrice, setOriginalPrice] = useState("");
  const [dealPrice, setDealPrice] = useState(prefill?.dealPrice ? String(prefill.dealPrice) : "");
  const [totalQty, setTotalQty] = useState(prefill?.totalQty ? String(prefill.totalQty) : "");
  const [location, setLocation] = useState("");
  const [closesInHours, setClosesInHours] = useState(
    prefill?.closesInHours ? String(prefill.closesInHours) : "24"
  );
  const [images, setImages] = useState<string[]>(prefill?.images ?? []);
  const [videoUrl, setVideoUrl] = useState<string | null>(prefill?.videoUrl ?? null);
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title || !dealPrice || !totalQty) {
      setError("매물명·판매가·수량은 필수예요.");
      return;
    }
    setSubmitting(true);
    const closesAt = new Date(Date.now() + Number(closesInHours) * 3600 * 1000).toISOString();
    try {
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title,
          category,
          region,
          originalPrice: parsePriceInput(originalPrice),
          dealPrice: parsePriceInput(dealPrice) ?? 0,
          totalQty: Number(totalQty),
          location,
          closesAt,
          requestId,
          images,
          videoUrl,
          description,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sent = data.push?.sentCount ?? 0;
      alert(`매물이 등록됐어요. 구독자 ${sent}명에게 알림을 발송했어요.`);
      onDone();
    } catch {
      setError("등록에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 bg-gray100 rounded-xl p-3.5 flex flex-col gap-3">
      <input
        className="border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange"
        placeholder="매물명 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          className="flex-1 min-w-0 border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {mockCategories.map((c) => (
            <option key={c} value={c}>
              {categoryIcons[c]} {c}
            </option>
          ))}
        </select>
        <select
          className="flex-1 min-w-0 border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {mockRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            className="w-full border-2 border-gray200 rounded-lg pl-3 pr-8 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="정상가 (선택)"
            value={formatPriceInput(originalPrice)}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray500">원</span>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            className="w-full border-2 border-gray200 rounded-lg pl-3 pr-8 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="판매가 *"
            value={formatPriceInput(dealPrice)}
            onChange={(e) => setDealPrice(e.target.value)}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray500">원</span>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          className="flex-1 min-w-0 border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="총 수량 *"
          value={totalQty}
          onChange={(e) => setTotalQty(e.target.value)}
        />
        <input
          className="flex-1 min-w-0 border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="지역 상세 (예: 서울 가락동)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray500 mb-1 block">마감까지 남은 시간</label>
        <select
          className="w-full border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm"
          value={closesInHours}
          onChange={(e) => setClosesInHours(e.target.value)}
        >
          <option value="3">3시간</option>
          <option value="12">12시간</option>
          <option value="24">24시간</option>
          <option value="72">3일</option>
          <option value="168">7일</option>
        </select>
      </div>

      <textarea
        className="border-2 border-gray200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-trustBlue"
        rows={2}
        placeholder="소비기한, 보관상태 등 상세 설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && <div className="text-xs text-orange font-medium">{error}</div>}

      <ImageUploader
        onChange={setImages}
        label="매물 사진"
        hint="최대 4장 (신청서에 첨부된 사진 포함)"
        initialUrls={prefill?.images ?? []}
      />

      <VideoUploader onChange={setVideoUrl} initialUrl={prefill?.videoUrl} />

      <button
        onClick={submit}
        disabled={submitting}
        className="text-white font-bold rounded-lg text-sm disabled:opacity-60"
        style={{ background: "#0B2540", padding: "12px 0" }}
      >
        {submitting ? "등록 중..." : "매물 등록 확정"}
      </button>
    </div>
  );
}
