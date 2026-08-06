import Link from "next/link";

export const metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-8 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/" className="text-white/70 text-sm">
          ‹ 홈으로
        </Link>
        <h1 className="font-display text-2xl mt-3">이용약관</h1>
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col gap-6 text-sm text-gray900 leading-relaxed">
        <Section title="제1조 (목적)">
          이 약관은 캐시티켓(이하 &ldquo;회사&rdquo;)이 제공하는 매장 금액권 발행·전달·사용
          서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련해 회사와 이용자(사장님·고객) 간의
          권리·의무 및 책임사항을 정합니다.
        </Section>

        <Section title="제2조 (금액권의 성격)">
          서비스를 통해 발행되는 금액권은 특정 매장에서만 사용할 수 있는 선불 전자적 증표입니다.
          현금으로 환전되지 않으며, 발행한 매장 외에서는 사용할 수 없습니다.
        </Section>

        <Section title="제3조 (결제 및 환불)">
          고객이 결제를 통해 금액권을 구매한 경우, 다음 기준에 따라 환불을 요청할 수 있습니다.
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>사용하지 않은 잔액은 결제일로부터 7일 이내 전액 환불 요청이 가능합니다.</li>
            <li>일부를 사용한 경우, 남은 잔액에 한해 환불 요청이 가능합니다.</li>
            <li>매장 사정으로 영업이 중단된 경우, 미사용 잔액 전액 환불을 요청할 수 있습니다.</li>
            <li>환불 요청은 결제한 매장으로 직접 문의해주세요.</li>
          </ul>
        </Section>

        <Section title="제4조 (유효기간)">
          금액권은 발행 시 사장님이 정한 유효기간(1개월~1년) 동안 사용할 수 있습니다. 유효기간이
          지난 금액권은 관련 법령이 정하는 범위 내에서 소멸될 수 있습니다.
        </Section>

        <Section title="제5조 (선물하기)">
          고객은 보유한 금액권 잔액의 일부 또는 전부를 다른 사람에게 선물(양도)할 수 있습니다.
          선물된 금액권은 원래 금액권과 동일한 매장·유효기간이 적용됩니다.
        </Section>

        <Section title="제6조 (책임의 한계)">
          회사는 매장과 고객 간 금액권 발행·사용을 중개하는 서비스를 제공하며, 매장의 영업 여부나
          상품·서비스 품질에 대해서는 책임지지 않습니다.
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
