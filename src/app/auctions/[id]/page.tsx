"use client";

import { use, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import type { AuctionDetail } from "@/lib/types";
import { formatWon, formatDateTime, formatRemaining, STATUS_LABEL } from "@/lib/format";

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/auctions/${id}`);
    const data = await res.json();
    if (res.ok) {
      setAuction(data.auction);
      // Default the bid input to the minimum viable bid, but only the first
      // time data loads — later polls shouldn't clobber what the user typed.
      setBidAmount((prev) =>
        prev === "" ? String(Number(data.auction.currentPrice) + Number(data.auction.minIncrement)) : prev,
      );
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!user) {
      setError("로그인 후 입찰할 수 있습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auctions/${id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(bidAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "입찰에 실패했습니다.");
        return;
      }
      setMessage(data.boughtNow ? "즉시구매로 낙찰되었습니다!" : "입찰이 반영되었습니다.");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">불러오는 중...</p>;
  if (!auction) return <p className="text-sm text-gray-500">경매를 찾을 수 없습니다.</p>;

  const isSeller = user?.id === auction.seller.id;
  const canBid = auction.status === "ACTIVE" && !isSeller;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {STATUS_LABEL[auction.status]}
          </span>
          {auction.category && <span className="text-xs text-gray-500">{auction.category.name}</span>}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{auction.title}</h1>
        <p className="mb-4 text-sm text-gray-500">
          판매자: {auction.seller.company?.name ?? auction.seller.name}
          {auction.seller.company?.verified && (
            <span className="ml-1 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              인증기업
            </span>
          )}
        </p>

        {auction.images.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {auction.images.map((url) => (
              <div key={url} className="relative h-32 w-32 overflow-hidden rounded border border-black/10 dark:border-white/15">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        )}

        <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed">{auction.description}</p>

        <h2 className="mb-2 font-semibold">입찰 내역</h2>
        {auction.bids.length === 0 && <p className="text-sm text-gray-500">아직 입찰이 없습니다.</p>}
        <ul className="flex flex-col gap-2">
          {auction.bids.map((b) => (
            <li key={b.id} className="flex justify-between rounded border border-black/10 px-3 py-2 text-sm dark:border-white/15">
              <span>{b.bidder.name}</span>
              <span className="font-medium">{formatWon(b.amount)}</span>
              <span className="text-gray-500">{formatDateTime(b.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded-lg border border-black/10 p-5 dark:border-white/15">
        <p className="text-xs text-gray-500">현재가 ({auction.quantity}{auction.unit})</p>
        <p className="mb-1 text-3xl font-bold text-blue-600">{formatWon(auction.currentPrice)}</p>
        <p className="mb-4 text-xs text-gray-500">시작가 {formatWon(auction.startPrice)}</p>

        {auction.buyNowPrice && (
          <p className="mb-4 text-sm">
            즉시구매가 <span className="font-semibold">{formatWon(auction.buyNowPrice)}</span>
          </p>
        )}

        <p className="mb-4 text-sm">
          {auction.status === "ACTIVE" ? formatRemaining(auction.endAt) : `마감 ${formatDateTime(auction.endAt)}`}
        </p>

        {auction.status === "ENDED" && (
          <p className="mb-4 rounded bg-gray-100 p-3 text-sm dark:bg-white/10">
            {auction.winner ? `낙찰자: ${auction.winner.name}` : "낙찰자가 없습니다."}
          </p>
        )}

        {isSeller && (
          <p className="text-sm text-gray-500">본인이 등록한 경매입니다.</p>
        )}

        {canBid && (
          <form onSubmit={handleBid} className="flex flex-col gap-2">
            <input
              type="number"
              className="input"
              value={bidAmount}
              min={Number(auction.currentPrice) + Number(auction.minIncrement)}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "처리 중..." : "입찰하기"}
            </button>
          </form>
        )}

        {!user && auction.status === "ACTIVE" && (
          <p className="mt-2 text-sm text-gray-500">입찰하려면 로그인이 필요합니다.</p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
}
