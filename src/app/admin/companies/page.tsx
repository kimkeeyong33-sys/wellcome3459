"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/format";

interface CompanyRow {
  id: string;
  name: string;
  registrationNumber: string;
  verified: boolean;
  createdAt: string;
  users: { id: string; name: string; email: string; role: string }[];
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/companies");
    const data = await res.json();
    if (res.ok) setCompanies(data.companies ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
      load();
    }
  }, [user, load]);

  async function toggleVerified(company: CompanyRow) {
    setPendingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !company.verified }),
      });
      if (res.ok) await load();
    } finally {
      setPendingId(null);
    }
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">기업 인증 관리</h1>
      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
      {!loading && companies.length === 0 && <p className="text-sm text-gray-500">등록된 기업이 없습니다.</p>}
      <ul className="flex flex-col gap-3">
        {companies.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-2 rounded border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/15"
          >
            <div>
              <p className="font-medium">
                {c.name}{" "}
                <span
                  className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
                    c.verified
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {c.verified ? "인증됨" : "미인증"}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                사업자번호 {c.registrationNumber} · 가입 {formatDateTime(c.createdAt)}
              </p>
              <p className="text-xs text-gray-500">
                소속 회원: {c.users.map((u) => `${u.name}(${u.role})`).join(", ") || "없음"}
              </p>
            </div>
            <button
              onClick={() => toggleVerified(c)}
              disabled={pendingId === c.id}
              className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                c.verified
                  ? "border border-black/15 dark:border-white/20"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {c.verified ? "인증 취소" : "인증 승인"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
