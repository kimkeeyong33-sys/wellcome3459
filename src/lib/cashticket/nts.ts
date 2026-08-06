// 국세청 사업자등록정보 진위확인 API (공공데이터포털)
// https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=...&returnType=JSON
// BIZNO_API_KEY가 없으면 검증을 건너뜁니다(선택 항목이라 가입 자체는 막지 않음).

export function isNtsConfigured() {
  return Boolean(process.env.BIZNO_API_KEY);
}

export async function verifyBusinessNumber(input: {
  businessNumber: string; // 하이픈 없는 10자리
  openDate: string; // YYYYMMDD
  repName: string;
}): Promise<{ verified: boolean; reason?: string }> {
  const serviceKey = process.env.BIZNO_API_KEY as string;
  const url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${serviceKey}&returnType=JSON`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businesses: [
        {
          b_no: input.businessNumber,
          start_dt: input.openDate,
          p_nm: input.repName,
        },
      ],
    }),
  });

  if (!res.ok) return { verified: false, reason: "국세청 조회에 실패했어요." };

  const data = await res.json();
  const result = data?.data?.[0];
  if (!result) return { verified: false, reason: "조회 결과가 없어요." };

  // valid: "01" = 확인됨, "02" = 확인 불가(정보 불일치 등)
  if (result.valid === "01") return { verified: true };
  return { verified: false, reason: result.valid_msg || "입력하신 정보와 일치하지 않아요." };
}
