"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";
import { formatPrice, formatPriceInput, parsePriceInput } from "@/lib/format";

type Product = { id: string; name: string; price: number };

export default function OwnerMenuPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async (storeId: string) => {
    const res = await fetch("/api/owner/products", { headers: { "x-store-id": storeId } });
    const data = await res.json();
    if (res.ok) setProducts(data.products);
    setLoading(false);
  };

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
    load(s.storeId);
  }, [router]);

  const price = parsePriceInput(priceInput) ?? 0;

  const add = async () => {
    if (!session) return;
    setError(null);
    if (!name.trim()) {
      setError("상품·서비스 이름을 입력해주세요.");
      return;
    }
    if (!price || price <= 0) {
      setError("가격을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-store-id": session.storeId },
        body: JSON.stringify({ name, price }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "등록 중 오류가 발생했어요.");
        return;
      }
      setProducts((prev) => [...prev, data.product]);
      setName("");
      setPriceInput("");
    } catch {
      setError("등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!session) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/owner/products/${id}`, {
      method: "DELETE",
      headers: { "x-store-id": session.storeId },
    });
  };

  if (!session) return null;

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/owner/settings" className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3">상품·가격표 관리</h1>
        <p className="text-white/80 text-sm mt-2">
          결제·티켓 화면에서 고객이 미리 확인할 수 있어요.
        </p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <label className="text-base font-bold text-navy">새 상품·서비스 추가</label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
            style={{ height: "52px" }}
            placeholder="예: 아메리카노, 커트, 세탁(드라이)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="relative">
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 pr-12 text-lg font-bold text-right outline-none focus:border-orange"
              style={{ height: "56px" }}
              placeholder="가격"
              value={priceInput}
              onChange={(e) => setPriceInput(formatPriceInput(e.target.value))}
              inputMode="numeric"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray500">
              원
            </span>
          </div>
          {error && <div className="text-sm text-orange font-medium">{error}</div>}
          <button
            onClick={add}
            disabled={submitting}
            className="w-full text-white text-center font-bold rounded-xl text-base disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "14px 0" }}
          >
            {submitting ? "추가 중..." : "추가하기"}
          </button>
        </div>

        <div>
          <div className="text-base font-bold text-navy mb-2.5">등록된 상품·서비스</div>
          {loading ? (
            <div className="text-sm text-gray500">불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray500 text-sm py-8 bg-gray100 rounded-2xl">
              아직 등록된 상품이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-gray200 px-4 py-3"
                >
                  <div className="text-sm font-bold text-navy">{p.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-navy">{formatPrice(p.price)}</div>
                    <button onClick={() => remove(p.id)} className="text-xs text-gray500 underline">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
