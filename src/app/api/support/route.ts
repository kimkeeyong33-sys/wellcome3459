import { NextRequest, NextResponse } from "next/server";
import { mockSupportPrograms, type SupportProgram } from "@/lib/support";

// 기업마당(bizinfo.go.kr) 공식 오픈 API를 서버에서 대신 호출합니다.
// API 키를 브라우저에 노출하지 않으려고 이 라우트를 경유시킵니다.
// 키 발급: https://www.bizinfo.go.kr (지원사업정보 API > 사용신청)

const BIZINFO_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

type BizinfoItem = {
  pblancId: string;
  pblancNm: string;
  bsnsSumryCn: string;
  reqstBeginEndDe: string;
  jrsdInsttNm: string;
  excInsttNm: string;
  pblancUrl: string;
  hashtags?: string;
  trgetNm?: string;
  pldirSportRealmLclasCodeNm?: string;
  creatPnttm: string;
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.BIZINFO_API_KEY;
  const { searchParams } = new URL(req.url);
  const hashtags = searchParams.get("hashtags") ?? "";

  if (!apiKey) {
    // 키 미설정 시 로컬 데모용 목업 데이터로 대체
    const filtered = hashtags
      ? mockSupportPrograms.filter((p) => p.region.includes(hashtags) || p.title.includes(hashtags))
      : mockSupportPrograms;
    return NextResponse.json({ items: filtered, source: "mock" });
  }

  const params = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: "json",
    searchCnt: "30",
  });
  if (hashtags) params.append("hashtags", hashtags);

  try {
    const res = await fetch(`${BIZINFO_URL}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!res.ok) {
      return NextResponse.json({ error: "기업마당 API 요청 실패" }, { status: 502 });
    }

    const data = await res.json();
    if (data.reqErr) {
      return NextResponse.json({ error: data.reqErr }, { status: 502 });
    }

    const items: SupportProgram[] = ((data.jsonArray ?? []) as BizinfoItem[]).map((d) => ({
      id: d.pblancId,
      title: d.pblancNm,
      summary: d.bsnsSumryCn,
      period: d.reqstBeginEndDe,
      org: d.jrsdInsttNm,
      execOrg: d.excInsttNm,
      url: d.pblancUrl,
      region: d.hashtags || "전국",
      target: d.trgetNm || "",
      category: d.pldirSportRealmLclasCodeNm || "기타",
      createdAt: d.creatPnttm,
    }));

    return NextResponse.json({ items, source: "live" });
  } catch {
    return NextResponse.json({ items: mockSupportPrograms, source: "mock" });
  }
}
