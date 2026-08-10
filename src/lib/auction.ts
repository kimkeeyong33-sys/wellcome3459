import type { Auction } from "./mockData";

type PriceFields = Pick<
  Auction,
  "start_price" | "floor_price" | "price_step" | "drop_interval_sec" | "starts_at"
>;

// 하향경매 현재가 계산 — starts_at 이후 drop_interval_sec마다 price_step씩 내려가고, floor_price 밑으로는 내려가지 않습니다.
export function computeAuctionPrice(auction: PriceFields, now: number): number {
  const startMs = new Date(auction.starts_at).getTime();
  const elapsedSec = Math.max(0, (now - startMs) / 1000);
  const steps = Math.floor(elapsedSec / auction.drop_interval_sec);
  const price = auction.start_price - steps * auction.price_step;
  return Math.max(auction.floor_price, price);
}

// 다음 가격 하락까지 남은 시간(ms). 이미 바닥가라면 null.
export function msUntilNextDrop(auction: PriceFields, now: number): number | null {
  if (computeAuctionPrice(auction, now) <= auction.floor_price) return null;

  const startMs = new Date(auction.starts_at).getTime();
  const elapsedSec = Math.max(0, (now - startMs) / 1000);
  const steps = Math.floor(elapsedSec / auction.drop_interval_sec);
  const nextDropAtMs = startMs + (steps + 1) * auction.drop_interval_sec * 1000;
  return Math.max(0, nextDropAtMs - now);
}
