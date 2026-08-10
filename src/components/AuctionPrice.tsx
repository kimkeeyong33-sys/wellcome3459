"use client";

import { useEffect, useState } from "react";
import { computeAuctionPrice, msUntilNextDrop } from "@/lib/auction";
import { formatPrice } from "@/lib/format";
import type { Auction } from "@/lib/mockData";

type PriceFields = Pick<
  Auction,
  "start_price" | "floor_price" | "price_step" | "drop_interval_sec" | "starts_at"
>;

function formatMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 하향경매 현재가를 1초마다 갱신해서 보여줍니다. 다음 가격 하락까지 남은 시간도 함께 표시합니다.
export default function AuctionPrice({
  auction,
  size = "sm",
}: {
  auction: PriceFields;
  size?: "sm" | "lg";
}) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const price = now ? computeAuctionPrice(auction, now) : auction.start_price;
  const nextDropMs = now ? msUntilNextDrop(auction, now) : null;
  const atFloor = price <= auction.floor_price;

  if (size === "lg") {
    return (
      <div>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-black" style={{ color: "#6C3FC2" }}>
            {formatPrice(price)}
          </span>
          <span className="text-base text-gray500 line-through font-semibold">
            {formatPrice(auction.start_price)}
          </span>
        </div>
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
          style={atFloor ? { background: "#F1F1EF", color: "#6B7480" } : { background: "#F3EBFF", color: "#6C3FC2" }}
        >
          {atFloor
            ? "바닥가에 도달했어요 · 지금이 최저가"
            : `⏱ ${nextDropMs !== null ? formatMs(nextDropMs) : "--:--"} 후 ${formatPrice(auction.price_step)} 추가 하락`}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-black" style={{ color: "#6C3FC2" }}>
        {formatPrice(price)}
      </span>
      {!atFloor && (
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: "#F3EBFF", color: "#6C3FC2" }}
        >
          ⏱ {nextDropMs !== null ? formatMs(nextDropMs) : "--:--"}
        </span>
      )}
    </div>
  );
}
