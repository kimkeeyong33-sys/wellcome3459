export type SupportProgram = {
  id: string;
  title: string;
  summary: string;
  period: string; // 접수기간
  org: string; // 소관기관
  execOrg: string; // 수행기관
  url: string;
  region: string; // hashtags에서 추출
  target: string; // 지원대상
  category: string; // 분야
  createdAt: string;
};

// 기업마당 분야 코드 (지원사업 검색 시 활용)
export const bizinfoCategories: Record<string, string> = {
  금융: "PLD0001",
  기술: "PLD0002",
  인력: "PLD0003",
  수출: "PLD0004",
  내수: "PLD0005",
  창업: "PLD0006",
  경영: "PLD0007",
  기타: "PLD0008",
};

// API 키 미설정(로컬 데모) 시 사용할 목업 데이터
export const mockSupportPrograms: SupportProgram[] = [
  {
    id: "mock-1",
    title: "2026년 소상공인 정책자금 융자 지원",
    summary: "운영자금 및 시설자금을 저금리로 지원하는 소상공인 정책자금 공고입니다.",
    period: "2026.07.01 ~ 2026.12.31",
    org: "중소벤처기업부",
    execOrg: "소상공인시장진흥공단",
    url: "https://www.bizinfo.go.kr",
    region: "전국",
    target: "소상공인",
    category: "금융",
    createdAt: "2026-07-01",
  },
  {
    id: "mock-2",
    title: "수출 초보기업 해외 판로개척 지원사업",
    summary: "해외 전시회 참가비 및 물류비를 지원하여 수출 초보기업의 판로 개척을 돕습니다.",
    period: "2026.07.10 ~ 2026.08.20",
    org: "중소벤처기업부",
    execOrg: "중소기업유통센터",
    url: "https://www.bizinfo.go.kr",
    region: "전국",
    target: "중소기업",
    category: "수출",
    createdAt: "2026-07-05",
  },
  {
    id: "mock-3",
    title: "경기도 유통업체 물류비 지원사업",
    summary: "도내 유통·물류 중소기업의 물류비 일부를 지원하는 사업입니다.",
    period: "2026.07.15 ~ 2026.09.30",
    org: "경기도",
    execOrg: "경기도경제과학진흥원",
    url: "https://www.bizinfo.go.kr",
    region: "경기",
    target: "중소기업, 소상공인",
    category: "내수",
    createdAt: "2026-07-10",
  },
];
