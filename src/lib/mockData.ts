export type Deal = {
  id: string;
  title: string;
  category: string;
  region: string;
  location: string;
  original_price: number;
  deal_price: number;
  total_qty: number;
  remaining_qty: number;
  closes_at: string; // ISO
  images?: string[];
  video_url?: string | null;
  description?: string;
  status?: "active" | "closed";
};

const now = Date.now();

export const mockDeals: Deal[] = [
  {
    id: "1",
    title: "국내산 갈치 20kg 박스",
    category: "농수축산물",
    region: "서울",
    location: "서울 가락동",
    original_price: 380000,
    deal_price: 219000,
    total_qty: 55,
    remaining_qty: 12,
    closes_at: new Date(now + 1000 * 60 * 60 * 2.97).toISOString(),
    description: "소비기한 등록일로부터 5일 · 냉동 보관 · 박스당 20kg 균일 포장 · 원산지 증명서 제공 가능",
  },
  {
    id: "2",
    title: "스테인리스 텀블러 500ea",
    category: "생활용품",
    region: "인천",
    location: "인천 남동공단",
    original_price: 4200,
    deal_price: 2300,
    total_qty: 500,
    remaining_qty: 340,
    closes_at: new Date(now + 1000 * 60 * 60 * 11.66).toISOString(),
    description: "박스 및 개별 포장 상태 양호 · 사용 흔적 없는 신품 재고 · KC 인증서 보유",
  },
  {
    id: "3",
    title: "계절 재고 우산 1,200개",
    category: "패션잡화",
    region: "경기",
    location: "경기 부천",
    original_price: 3500,
    deal_price: 1900,
    total_qty: 1200,
    remaining_qty: 1080,
    closes_at: new Date(now + 1000 * 60 * 60 * 28.2).toISOString(),
    description: "전 시즌 이월 재고 · 박스 단위(50개입) 판매 · 색상 랜덤 혼합 구성",
  },
  {
    id: "4",
    title: "산업용 스테인리스 원자재 10톤",
    category: "산업원자재",
    region: "경남",
    location: "경남 김해",
    original_price: 42000000,
    deal_price: 29800000,
    total_qty: 10,
    remaining_qty: 4,
    closes_at: new Date(now + 1000 * 60 * 60 * 5.4).toISOString(),
    description: "재질 증명서(밀시트) 제공 · 규격 균일 · 직접 방문 실사 가능 · 지게차 상차 지원",
  },
  {
    id: "5",
    title: "명품 화장품 재고 (립스틱 외) 800개",
    category: "화장품",
    region: "경기",
    location: "경기 이천",
    original_price: 28000,
    deal_price: 12900,
    total_qty: 800,
    remaining_qty: 0,
    closes_at: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
    description: "정품 인증서 보유 · 마감 완료",
    status: "closed",
  },
  {
    id: "6",
    title: "완구 재고 캐릭터 인형 500개",
    category: "기타",
    region: "충남",
    location: "충남 천안",
    original_price: 9900,
    deal_price: 4500,
    total_qty: 500,
    remaining_qty: 0,
    closes_at: new Date(now - 1000 * 60 * 60 * 40).toISOString(),
    description: "KC 안전인증 완료 · 마감 완료",
    status: "closed",
  },
];

export const mockCategories = [
  "냉동냉장식품",
  "농수축산물",
  "생활용품",
  "패션잡화",
  "화장품",
  "전자제품",
  "산업원자재",
  "기계설비",
  "기타",
];

export const categoryIcons: Record<string, string> = {
  냉동냉장식품: "🧊",
  농수축산물: "🌾",
  생활용품: "📦",
  패션잡화: "👜",
  화장품: "💄",
  전자제품: "🔌",
  산업원자재: "🏗️",
  기계설비: "⚙️",
  기타: "🗂️",
};

// 카테고리마다 고유 컬러를 줘서 리스트에서 한눈에 구분되게 합니다.
export const categoryColors: Record<string, { bg: string; text: string; solid: string }> = {
  냉동냉장식품: { bg: "#E0F7FA", text: "#0E7C82", solid: "#17B8C4" },
  농수축산물: { bg: "#E8F8EC", text: "#1D8A44", solid: "#34C471" },
  생활용품: { bg: "#F3EBFF", text: "#7A3FC2", solid: "#9B5DE5" },
  패션잡화: { bg: "#FFE9F3", text: "#C22B72", solid: "#F5439B" },
  화장품: { bg: "#FFEAF0", text: "#C22050", solid: "#FF5C8A" },
  전자제품: { bg: "#EDEBFF", text: "#4C3FB8", solid: "#6C5CE7" },
  산업원자재: { bg: "#F5EDE4", text: "#7A5230", solid: "#A9744F" },
  기계설비: { bg: "#EAEDF5", text: "#3D4A66", solid: "#5C6B8C" },
  기타: { bg: "#F1F1EF", text: "#5C5C57", solid: "#8A8A82" },
};

export const mockRegions = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

// ---------------- 하향경매 (가격이 시간에 따라 자동으로 떨어지는 경매) ----------------
export type Auction = {
  id: string;
  title: string;
  category: string;
  region: string;
  location: string;
  images?: string[];
  description?: string;
  start_price: number; // 시작가
  floor_price: number; // 더 이상 내려가지 않는 바닥가
  price_step: number; // 한 번에 내려가는 금액
  drop_interval_sec: number; // 몇 초마다 내려가는지
  starts_at: string; // 가격이 내려가기 시작하는 시각 (ISO)
  ends_at: string; // 경매 마감 시각 (ISO)
  total_qty: number;
  remaining_qty: number;
  status?: "active" | "closed";
};

export const mockAuctions: Auction[] = [
  {
    id: "a1",
    title: "공장반품 에어프라이어 100대",
    category: "전자제품",
    region: "경기",
    location: "경기 안산",
    start_price: 89000,
    floor_price: 39000,
    price_step: 2000,
    drop_interval_sec: 600,
    starts_at: new Date(now - 1000 * 60 * 23).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 4).toISOString(),
    total_qty: 100,
    remaining_qty: 63,
    description: "박스 개봉 확인용 반품 · 작동 이상 없음 · 개별 포장 상태 양호 · 1년 무상 A/S 보증서 동봉",
  },
  {
    id: "a2",
    title: "동절기 이월 패딩 300벌",
    category: "패션잡화",
    region: "서울",
    location: "서울 성수동",
    start_price: 42000,
    floor_price: 15000,
    price_step: 1500,
    drop_interval_sec: 900,
    starts_at: new Date(now - 1000 * 60 * 40).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 8).toISOString(),
    total_qty: 300,
    remaining_qty: 300,
    description: "전 시즌 이월 재고 · 사이즈 랜덤 혼합 · 택 부착 신품",
  },
];

// ---------------- 공동구매 (참여 수량이 늘어날수록 단가가 내려가는 방식) ----------------
export type GroupBuyTier = { qty: number; price: number };

export type GroupBuy = {
  id: string;
  title: string;
  category: string;
  region: string;
  location: string;
  images?: string[];
  description?: string;
  tiers: GroupBuyTier[]; // 수량 오름차순 — 이 수량에 도달하면 해당 단가로 전환됩니다.
  target_qty: number; // 공동구매가 성사되기 위한 최소 수량
  current_qty: number;
  deadline: string; // ISO
  status?: "open" | "success" | "failed";
};

export const mockGroupBuys: GroupBuy[] = [
  {
    id: "g1",
    title: "국내산 한우 사골 20kg 박스",
    category: "농수축산물",
    region: "경북",
    location: "경북 안동",
    tiers: [
      { qty: 1, price: 89000 },
      { qty: 10, price: 79000 },
      { qty: 30, price: 69000 },
      { qty: 60, price: 59000 },
    ],
    target_qty: 10,
    current_qty: 24,
    deadline: new Date(now + 1000 * 60 * 60 * 30).toISOString(),
    description: "박스당 20kg 균일 포장 · 목표 수량 달성 시에만 진행 · 미달 시 전원 자동 취소",
  },
  {
    id: "g2",
    title: "사무용 A4 복사용지 500매 묶음",
    category: "생활용품",
    region: "서울",
    location: "서울 문래동",
    tiers: [
      { qty: 1, price: 4500 },
      { qty: 20, price: 3800 },
      { qty: 50, price: 3200 },
    ],
    target_qty: 20,
    current_qty: 9,
    deadline: new Date(now + 1000 * 60 * 60 * 50).toISOString(),
    description: "1박스(10묶음) 단위 배송 · 사무실/매장 공동구매 추천",
  },
];
