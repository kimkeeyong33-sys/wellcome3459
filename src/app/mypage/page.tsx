"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { AuctionListItem } from "@/lib/types";
import { formatWon, formatDateTime, STATUS_LABEL } from "@/lib/format";

interface MyBid {
  id: string;
  amount: string;
  createdAt: string;
  auction: {
    id: string;
    title: string;
    status: string;
    currentPrice: string;
    endAt: string;
    winnerId: string | null;
  };
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [myAuctions, setMyAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on user load
    setLoading(true);
    Promise.all([
      fetch("/api/me/bids").then((r) => r.json()),
      user.role === "SELLER"
        ? fetch(`/api/auctions?sellerId=${user.id}`).then((r) => r.json())
        : Promise.resolve({ auctions: [] }),
    ]).then(([bidData, auctionData]) => {
      setBids(bidData.bids ?? []);
      setMyAuctions(auctionData.auctions ?? []);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-4 text-2xl font-bold">내 입찰 현황</h1>
        {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
        {!loading && bids.length === 0 && <p className="text-sm text-gray-500">입찰 내역이 없습니다.</p>}
        <ul className="flex flex-col gap-2">
          {bids.map((b) => (
            <li key={b.id}>
              <Link
                href={`/auctions/${b.auction.id}`}
                className="flex items-center justify-between rounded border border-black/10 px-4 py-3 text-sm hover:border-blue-500 dark:border-white/15"
              >
                <div>
                  <p className="font-medium">{b.auction.title}</p>
                  <p className="text-xs text-gray-500">
                    내 입찰가 {formatWon(b.amount)} · {formatDateTime(b.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs">{STATUS_LABEL[b.auction.status]}</p>
                  <p className="font-semibold">{formatWon(b.auction.currentPrice)}</p>
                  {b.auction.status === "ENDED" && b.auction.winnerId === user.id && (
                    <p className="text-xs font-medium text-green-600">낙찰 성공</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {user.role === "SELLER" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">내가 등록한 경매</h1>
            <Link href="/auctions/new" className="text-sm text-blue-600 hover:underline">
              + 새 경매 등록
            </Link>
          </div>
          {!loading && myAuctions.length === 0 && (
            <p className="text-sm text-gray-500">등록한 경매가 없습니다.</p>
          )}
          <ul className="flex flex-col gap-2">
            {myAuctions.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/auctions/${a.id}`}
                  className="flex items-center justify-between rounded border border-black/10 px-4 py-3 text-sm hover:border-blue-500 dark:border-white/15"
                >
                  <p className="font-medium">{a.title}</p>
                  <div className="text-right">
                    <p className="text-xs">{STATUS_LABEL[a.status]}</p>
                    <p className="font-semibold">{formatWon(a.currentPrice)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
