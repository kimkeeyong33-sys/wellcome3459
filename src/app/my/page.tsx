"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addToWallet, getWalletCodes, removeFromWallet } from "@/lib/cashticket/wallet";
import { formatPrice } from "@/lib/format";

type WalletTicket = {
  code: string;
  storeName: string;
  balance: number;
  status: string;
  expiresAt: string;
  notFound?: boolean;
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<WalletTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCode, setAddCode] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const load = async () => {
    setLoading(true);
    const codes = getWalletCodes();
    const results = await Promise.all(
      codes.map(async (code) => {
        const res = await fetch(`/api/tickets/${code}`);
        if (!res.ok) return { code, storeName: "", balance: 0, status: "", expiresAt: "", notFound: true };
        const data = await res.json();
        return { code, ...data.ticket };
      })
    );
    setTickets(results);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addByCode = async () => {
    setAddError(null);
    const code = addCode.trim().toUpperCase();
    if (!code) return;
    const res = await fetch(`/api/tickets/${code}`);
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || "티켓을 찾을 수 없어요.");
      return;
    }
    addToWallet(code);
    setAddCode("");
    load();
  };

  const remove = (code: string) => {
    removeFromWallet(code);
    setTickets((prev) => prev.filter((t) => t.code !== code));
  };

  const isActive = (t: WalletTicket) =>
    !t.notFound && t.status === "active" && new Date(t.expiresAt).getTime() > now;

  const active = tickets.filter(isActive).sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  );
  const inactive = tickets.filter((t) => !isActive(t));

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-8 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/" className="text-white/70 text-sm">
          ‹ 홈으로
        </Link>
        <h1 className="font-display text-2xl mt-3">내 티켓 모아보기</h1>
        {active.length > 0 && (
          <p className="text-white/80 text-sm mt-2">
            사용 가능한 티켓 {active.length}장 · 총{" "}
            {formatPrice(active.reduce((s, t) => s + t.balance, 0))}
          </p>
        )}
      </div>

      <div className="flex-1 px-5 py-6">
        {loading ? (
          <div className="text-center text-gray500 py-16">불러오는 중...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center text-gray500 py-16 bg-gray100 rounded-2xl">
            <div className="text-3xl mb-2">🎫</div>
            아직 저장된 티켓이 없어요.
            <br />
            매장에서 받은 링크를 열면 자동으로 저장돼요.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {active.map((t) => (
                  <TicketRow key={t.code} ticket={t} now={now} />
                ))}
              </div>
            )}

            {inactive.length > 0 && (
              <div className="mt-7">
                <div className="text-sm font-bold text-gray500 mb-2.5">사용완료 · 소멸된 티켓</div>
                <div className="flex flex-col gap-2">
                  {inactive.map((t) => (
                    <div
                      key={t.code}
                      className="flex items-center justify-between rounded-xl bg-gray100 px-4 py-3 opacity-70"
                    >
                      <div className="text-sm text-gray500">
                        {t.notFound ? "찾을 수 없는 티켓" : `${t.storeName} · ${t.code}`}
                      </div>
                      <button
                        onClick={() => remove(t.code)}
                        className="text-xs text-gray500 underline flex-shrink-0 ml-2"
                      >
                        지우기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8">
          <div className="text-sm font-bold text-navy mb-2">코드로 티켓 추가하기</div>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-lg font-bold text-center tracking-[0.2em] outline-none focus:border-orange uppercase"
              style={{ height: "52px" }}
              placeholder="티켓 코드 입력"
              value={addCode}
              onChange={(e) => setAddCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addByCode()}
              maxLength={6}
            />
            <button
              onClick={addByCode}
              className="text-white font-bold rounded-xl text-base px-5 whitespace-nowrap flex-shrink-0"
              style={{ background: "#0B2540" }}
            >
              추가
            </button>
          </div>
          {addError && <div className="text-sm text-orange font-medium mt-2">{addError}</div>}
        </div>
      </div>
    </main>
  );
}

function TicketRow({ ticket, now }: { ticket: WalletTicket; now: number }) {
  const daysLeft = Math.ceil(
    (new Date(ticket.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
  );
  const urgent = daysLeft <= 14;

  return (
    <Link
      href={`/t/${ticket.code}`}
      className="flex items-center justify-between rounded-2xl border-2 border-gray200 px-4 py-4 active:scale-[0.98] transition-transform"
    >
      <div className="min-w-0">
        <div className="text-sm font-bold text-navy truncate">{ticket.storeName}</div>
        <div className="text-xs text-gray500 mt-0.5">코드 {ticket.code}</div>
        {urgent && (
          <div className="text-xs font-bold text-orange mt-1">
            ⏰ {daysLeft > 0 ? `${daysLeft}일 후 소멸` : "오늘 소멸"}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <div className="text-lg font-black text-navy">{formatPrice(ticket.balance)}</div>
      </div>
    </Link>
  );
}
