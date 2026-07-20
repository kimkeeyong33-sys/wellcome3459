"use client";

import Link from "next/link";
import type { AuctionListItem } from "@/lib/types";
import { formatWon, formatRemaining, STATUS_LABEL } from "@/lib/format";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ENDED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function AuctionCard({ auction }: { auction: AuctionListItem }) {
  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 transition hover:border-blue-500 hover:shadow-sm dark:border-white/15"
    >
      <div className="flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[auction.status] ?? ""}`}>
          {STATUS_LABEL[auction.status]}
        </span>
        {auction.category && <span className="text-xs text-gray-500">{auction.category.name}</span>}
      </div>
      <h3 className="line-clamp-2 font-semibold">{auction.title}</h3>
      <p className="text-xs text-gray-500">{auction.seller.company?.name ?? auction.seller.name}</p>
      <div className="mt-auto flex items-end justify-between pt-2">
        <div>
          <p className="text-xs text-gray-500">현재가</p>
          <p className="text-lg font-bold text-blue-600">{formatWon(auction.currentPrice)}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>입찰 {auction._count.bids}건</p>
          <p>{auction.status === "ACTIVE" ? formatRemaining(auction.endAt) : ""}</p>
        </div>
      </div>
    </Link>
  );
}
