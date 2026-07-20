"use client";

import { useEffect, useMemo, useState } from "react";
import { AuctionCard } from "@/components/AuctionCard";
import type { AuctionListItem } from "@/lib/types";

const STATUS_TABS = [
  { value: "ACTIVE", label: "진행중" },
  { value: "SCHEDULED", label: "예정" },
  { value: "ENDED", label: "종료" },
  { value: "", label: "전체" },
] as const;

export default function HomePage() {
  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    setLoading(true);
    fetch(`/api/auctions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setAuctions(data.auctions ?? []))
      .finally(() => setLoading(false));
  }, [status, q]);

  const empty = useMemo(() => !loading && auctions.length === 0, [loading, auctions]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">B2B 경매</h1>
        <input
          className="input w-full sm:w-72"
          placeholder="상품명 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              status === tab.value
                ? "bg-blue-600 text-white"
                : "border border-black/15 dark:border-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
      {empty && <p className="text-sm text-gray-500">해당 조건의 경매가 없습니다.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {auctions.map((a) => (
          <AuctionCard key={a.id} auction={a} />
        ))}
      </div>
    </div>
  );
}
