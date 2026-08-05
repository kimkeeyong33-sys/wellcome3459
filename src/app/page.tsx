import Link from "next/link";
import InstallAppButton from "@/components/InstallAppButton";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-10 pb-8 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 mb-5">
          <span>💛</span>
          <span className="text-xs font-bold text-white/90">카카오톡을 쓸 줄 알면 바로 시작</span>
        </div>
        <h1 className="font-display text-3xl leading-snug drop-shadow-sm">
          우리 매장 금액권,
          <br />
          <span style={{ color: "#F2891F" }}>캐시티켓</span>으로 간단하게
        </h1>
        <p className="text-white/85 text-base mt-4 leading-relaxed">
          사장님은 금액을 정해 발행하고 카카오톡으로 보내면 끝. 고객은 매장에 가서 화면만 보여주면
          바로 사용돼요.
        </p>
      </div>

      <div className="px-5 pt-5">
        <InstallAppButton />
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        <Link
          href="/owner/login"
          className="flex items-center gap-4 rounded-2xl border-2 border-gray200 px-5 py-5 active:scale-[0.98] transition-transform"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "#FDEEE8" }}
          >
            🏪
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-navy">사장님이신가요?</div>
            <div className="text-sm text-gray500 mt-0.5">매장 등록하고 금액권 발행하기</div>
          </div>
          <div className="text-2xl text-gray500">›</div>
        </Link>

        <Link
          href="/my"
          className="flex items-center gap-4 rounded-2xl border-2 border-gray200 px-5 py-5 active:scale-[0.98] transition-transform"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "#F5F6F8" }}
          >
            🎁
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-navy">받은 티켓이 있으신가요?</div>
            <div className="text-sm text-gray500 mt-0.5">내 티켓 모아보기 · 잔액 확인</div>
          </div>
          <div className="text-2xl text-gray500">›</div>
        </Link>
      </div>

      <div className="px-5 pt-9">
        <div className="text-base font-bold text-navy mb-3.5">이렇게 사용해요</div>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: "🏪", title: "① 매장 등록", desc: "사장님이 가입하고 매장 정보를 입력해요" },
            { icon: "🎫", title: "② 금액권 발행", desc: "금액과 유효기간을 정해 티켓을 만들어요" },
            { icon: "💬", title: "③ 카카오톡으로 전달", desc: "고객에게 링크 하나로 바로 보내요" },
            { icon: "📱", title: "④ 매장에서 사용", desc: "고객이 화면을 보여주면 QR로 결제 확인해요" },
            { icon: "🎁", title: "⑤ 선물도 가능", desc: "남은 잔액을 나눠서 다른 사람에게 선물해요" },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-3 rounded-2xl bg-gray100 px-4 py-3.5">
              <span className="text-2xl flex-shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-navy">{s.title}</div>
                <div className="text-xs text-gray500 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-9 px-5" style={{ paddingBottom: "48px" }}>
        <Link
          href="/owner/signup"
          className="block text-white text-center font-bold rounded-2xl shadow-lg"
          style={{
            background: "linear-gradient(135deg, #D9531E, #F2891F)",
            padding: "20px 0",
            fontSize: "19px",
            boxShadow: "0 10px 24px rgba(217,83,30,0.35)",
          }}
        >
          🏪 우리 매장 무료로 시작하기
        </Link>
      </div>
    </main>
  );
}
