"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface Category {
  id: string;
  name: string;
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function NewAuctionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60000);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    startPrice: "",
    minIncrement: "1000",
    buyNowPrice: "",
    quantity: "1",
    unit: "개",
    startAt: toLocalInputValue(inOneHour),
    endAt: toLocalInputValue(inThreeDays),
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []));
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "SELLER")) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "이미지 업로드에 실패했습니다.");
          continue;
        }
        setImages((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          images,
          categoryId: form.categoryId || undefined,
          startPrice: Number(form.startPrice),
          minIncrement: Number(form.minIncrement),
          buyNowPrice: form.buyNowPrice ? Number(form.buyNowPrice) : undefined,
          quantity: Number(form.quantity),
          unit: form.unit,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      router.push(`/auctions/${data.auction.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">경매 등록</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="상품명">
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="상품 설명">
          <textarea
            required
            rows={5}
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="상품 이미지 (jpg/png/webp, 5MB 이하)">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
          {uploading && <p className="mt-1 text-xs text-gray-500">업로드 중...</p>}
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded border border-black/10 dark:border-white/15">
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-black/60 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <Field label="카테고리">
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">선택 안함</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="수량">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label="단위">
            <input
              required
              className="input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="시작가 (원)">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.startPrice}
              onChange={(e) => setForm({ ...form, startPrice: e.target.value })}
            />
          </Field>
          <Field label="최소 입찰 단위 (원)">
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.minIncrement}
              onChange={(e) => setForm({ ...form, minIncrement: e.target.value })}
            />
          </Field>
        </div>
        <Field label="즉시구매가 (선택, 원)">
          <input
            type="number"
            min={1}
            className="input"
            value={form.buyNowPrice}
            onChange={(e) => setForm({ ...form, buyNowPrice: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="시작 일시">
            <input
              type="datetime-local"
              required
              className="input"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </Field>
          <Field label="마감 일시">
            <input
              type="datetime-local"
              required
              className="input"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "경매 등록"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
