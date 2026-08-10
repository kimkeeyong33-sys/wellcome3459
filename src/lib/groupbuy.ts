import type { GroupBuyTier } from "./mockData";

// tiers는 qty 오름차순이어야 합니다. 현재 참여 수량이 도달한 가장 높은 단계의 단가를 반환합니다.
export function currentTierPrice(tiers: GroupBuyTier[], currentQty: number): GroupBuyTier {
  let applicable = tiers[0];
  for (const t of tiers) {
    if (currentQty >= t.qty) applicable = t;
  }
  return applicable;
}

// 더 참여하면 단가가 내려가는 다음 단계. 이미 최고 단계에 도달했다면 null.
export function nextTier(tiers: GroupBuyTier[], currentQty: number): GroupBuyTier | null {
  return tiers.find((t) => t.qty > currentQty) ?? null;
}
