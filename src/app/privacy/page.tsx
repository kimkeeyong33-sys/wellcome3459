import Link from "next/link";

export const metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-8 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/" className="text-white/70 text-sm">
          ‹ 홈으로
        </Link>
        <h1 className="font-display text-2xl mt-3">개인정보처리방침</h1>
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col gap-6 text-sm text-gray900 leading-relaxed">
        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>사장님(매장 가입)</b>: 성함, 휴대폰 번호, 비밀번호, 매장명, 업종, (선택) 사업자등록번호·개업일자·대표자명
            </li>
            <li>
              <b>고객</b>: 별도 회원가입 없이 이용 가능하며, 결제 시 결제대행사(토스페이먼츠)를 통해
              결제에 필요한 최소 정보만 처리됩니다. 회사는 카드번호 등 결제 상세정보를 저장하지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="2. 수집 목적">
          매장 등록 및 본인 확인, 금액권 발행·사용·정산 처리, 결제 및 환불 처리, 서비스 부정 이용
          방지, 사업자등록 진위확인(국세청 공개 API 이용)에 사용합니다.
        </Section>

        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 또는 매장 폐업 시까지 보유하며, 전자상거래법 등 관계 법령에 따라 결제·환불 관련
          기록은 5년간 보관합니다.
        </Section>

        <Section title="4. 제3자 제공 및 위탁">
          결제 처리를 위해 결제대행사(토스페이먼츠)에 결제에 필요한 최소 정보를 위탁합니다. 그 외
          제3자에게 개인정보를 제공하지 않습니다.
        </Section>

        <Section title="5. 이용자의 권리">
          이용자는 언제든지 본인의 개인정보 열람·정정·삭제를 요청할 수 있습니다.
        </Section>

        <div className="text-xs text-gray500 mt-4">시행일: 2026년 8월 5일</div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-base font-bold text-navy mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}
