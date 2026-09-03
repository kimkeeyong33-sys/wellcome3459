"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockCategories, mockRegions, categoryIcons, categoryColors } from "@/lib/mockData";
import { formatPrice, formatMemberNo } from "@/lib/format";
import { generateRefCode } from "@/lib/refCode";
import Toast, { useToast } from "@/components/Toast";
import BusinessLicenseUploader from "@/components/BusinessLicenseUploader";

type InterestItem = {
  id: string;
  deals: {
    id: string;
    title: string;
    deal_price: number;
    status: string;
  } | null;
};

type ReferralItem = {
  member_no: number | null;
  is_business: boolean;
  created_at: string;
};

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [memberNo, setMemberNo] = useState<number | null>(null);
  const [refCode, setRefCode] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessVerified, setBusinessVerified] = useState(false);
  const [hasBusinessLicense, setHasBusinessLicense] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const { message: toastMessage, showToast } = useToast();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      const userId = userData.user.id;

      const { data: member } = await supabase
        .from("members")
        .select("phone, ref_code, member_no, company_name, name, email, business_verified, business_license_path")
        .eq("id", userId)
        .single();
      if (member) {
        setPhone(member.phone);
        setMemberNo(member.member_no);
        setCompanyName(member.company_name ?? "");
        setFullName(member.name ?? "");
        setEmail(member.email ?? "");
        setBusinessVerified(Boolean(member.business_verified));
        setHasBusinessLicense(Boolean(member.business_license_path));
      }

      if (member?.ref_code) {
        setRefCode(member.ref_code);
      } else {
        // 이 기능이 생기기 전에 가입한 회원 — 지금 처음 코드를 발급해줌
        const newCode = generateRefCode();
        const { error: codeError } = await supabase
          .from("members")
          .update({ ref_code: newCode })
          .eq("id", userId);
        if (!codeError) setRefCode(newCode);
      }

      const { data: catRows } = await supabase
        .from("member_categories")
        .select("categories(name)")
        .eq("member_id", userId);
      setCategories(
        (catRows ?? [])
          .map((r) => (r.categories as unknown as { name: string } | null)?.name)
          .filter((name): name is string => Boolean(name))
      );

      const { data: regRows } = await supabase
        .from("member_regions")
        .select("regions(name)")
        .eq("member_id", userId);
      setRegions(
        (regRows ?? [])
          .map((r) => (r.regions as unknown as { name: string } | null)?.name)
          .filter((name): name is string => Boolean(name))
      );

      const { data: interestRows } = await supabase
        .from("interests")
        .select("id, deals(id, title, deal_price, status)")
        .eq("member_id", userId)
        .order("created_at", { ascending: false });
      setInterests((interestRows as unknown as InterestItem[]) ?? []);

      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData.session?.access_token ?? null;
      setAccessToken(sessionToken);
      if (sessionToken) {
        fetch("/api/my-referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: sessionToken }),
        })
          .then((res) => res.json())
          .then((data) => setReferrals(data.items ?? []))
          .catch(() => {});
      }

      setLoading(false);
    })();
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleShareRefLink = async () => {
    if (typeof window === "undefined" || !refCode) return;
    const url = `${window.location.origin}/signup?ref=${refCode}`;
    const text = `점프엑스 덤핑점핑 - 재고 특가 알림 받아보세요! ${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "덤핑점핑", text });
      } catch {
        // 사용자가 공유를 취소한 경우 — 무시
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // 클립보드 접근 실패 — 무시
    }
  };

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    setSaved(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userId = userData.user.id;

      await supabase.from("member_categories").delete().eq("member_id", userId);
      await supabase.from("member_regions").delete().eq("member_id", userId);

      const { data: catRows } = await supabase.from("categories").select("id, name").in("name", categories);
      const { data: regRows } = await supabase.from("regions").select("id, name").in("name", regions);

      if (catRows?.length) {
        await supabase
          .from("member_categories")
          .insert(catRows.map((c) => ({ member_id: userId, category_id: c.id })));
      }
      if (regRows?.length) {
        await supabase
          .from("member_regions")
          .insert(regRows.map((r) => ({ member_id: userId, region_id: r.id })));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!supabase) return;
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userId = userData.user.id;

      await supabase
        .from("members")
        .update({
          company_name: companyName || null,
          name: fullName || null,
          email: email || null,
        })
        .eq("id", userId);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setProfileSaving(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-4xl mb-4">🧪</div>
        <h1 className="font-display text-xl text-navy mb-2">데모 모드예요</h1>
        <p className="text-gray500 text-base leading-relaxed">
          Supabase가 연결되면 여기서
          <br />
          관심 매물과 알림 설정을 관리할 수 있어요.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray500 text-sm">
        불러오는 중...
      </main>
    );
  }

  if (notLoggedIn) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-display text-xl text-navy mb-2">로그인이 필요해요</h1>
        <p className="text-gray500 text-base leading-relaxed mb-6">
          내 정보를 보려면 먼저 가입해주세요.
        </p>
        <Link
          href="/signup"
          className="text-white text-center font-bold rounded-2xl text-base px-8"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "14px 32px" }}
        >
          알림 받기 시작
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-6 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="bg-white rounded-lg px-3.5 py-2.5 inline-block">
            <img src="/images/logo.png" alt="덤핑점핑" className="h-8 w-auto" />
          </Link>
          <span className="text-white/70 text-sm tracking-wide">Powered by JumpX</span>
        </div>
        <div className="text-xs font-bold tracking-widest" style={{ color: "#FFD166" }}>
          내 정보
        </div>
        <div className="text-xs text-white/60 mt-2.5">나의 연락처</div>
        <h1 className="font-display text-2xl mt-0.5">{phone || "회원님"}</h1>
        {memberNo != null && (
          <>
            <div className="text-xs text-white/60 mt-2">회원번호</div>
            <div className="text-sm text-white/85 font-mono">{formatMemberNo(memberNo)}</div>
          </>
        )}
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-6">
        <div>
          <label className="mb-2 flex items-center justify-between">
            <span className="text-base font-bold text-navy">관심 카테고리</span>
            <button
              type="button"
              onClick={() =>
                setCategories(categories.length === mockCategories.length ? [] : [...mockCategories])
              }
              className="text-xs font-bold text-orange"
            >
              {categories.length === mockCategories.length ? "전체 해제" : "전체 선택"}
            </button>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {mockCategories.map((c) => {
              const picked = categories.includes(c);
              const color = categoryColors[c];
              return (
                <button
                  key={c}
                  onClick={() => toggle(categories, setCategories, c)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border py-3.5 px-1 text-center"
                  style={
                    picked
                      ? { background: color.solid, borderColor: color.solid, color: "#fff" }
                      : { background: color.bg, borderColor: color.bg, color: color.text }
                  }
                >
                  <span className="text-2xl leading-none">{categoryIcons[c]}</span>
                  <span className="text-sm font-bold leading-tight">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-navy">관심 지역</span>
            <button
              type="button"
              onClick={() =>
                setRegions(regions.length === mockRegions.length ? [] : [...mockRegions])
              }
              className="text-xs font-bold text-orange"
            >
              {regions.length === mockRegions.length ? "전체 해제" : "전체 선택"}
            </button>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mockRegions.map((r) => (
              <button
                key={r}
                onClick={() => toggle(regions, setRegions, r)}
                className={`text-sm py-2.5 rounded-full border-2 font-bold text-center ${
                  regions.includes(r) ? "bg-navy text-white border-navy" : "border-gray200 text-gray500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="text-white font-bold rounded-2xl text-base disabled:opacity-60"
          style={{ background: "#0B2540", padding: "14px 0" }}
        >
          {saving ? "저장 중..." : saved ? "✓ 저장됐어요" : "설정 저장"}
        </button>

        <div className="border-t border-gray200 pt-5 flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold text-navy mb-1">프로필 완성하기</div>
            <p className="text-xs text-gray500 leading-relaxed">
              채워주시면 점핑매니저가 더 정확하게 도와드려요. 전부 선택 입력이라 지금 안 채워도 괜찮아요.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-navy mb-2 flex items-center gap-1.5">
              상호명
              <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
                선택
              </span>
            </label>
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: 웰컴코리아(주)"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-navy mb-2 flex items-center gap-1.5">
              성명
              <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
                선택
              </span>
            </label>
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="담당자 성함"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-navy mb-2 flex items-center gap-1.5">
              이메일
              <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
                선택
              </span>
            </label>
            <input
              type="email"
              className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
              style={{ height: "52px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
            />
          </div>

          <BusinessLicenseUploader
            accessToken={accessToken}
            status={businessVerified ? "verified" : hasBusinessLicense ? "pending" : "none"}
            onUploaded={() => {
              setHasBusinessLicense(true);
              setBusinessVerified(false);
              showToast("업로드됐어요. 확인 후 인증 완료로 전환돼요.");
            }}
          />

          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="font-bold rounded-2xl text-base disabled:opacity-60 border-2 border-gray200 text-navy"
            style={{ padding: "14px 0" }}
          >
            {profileSaving ? "저장 중..." : profileSaved ? "✓ 저장됐어요" : "프로필 저장"}
          </button>
        </div>

        <div className="border-t border-gray200 pt-5">
          <div className="text-sm font-bold text-navy mb-3">
            관심 표시한 매물 ({interests.length})
          </div>
          {interests.length === 0 && (
            <div className="text-center text-gray500 text-sm py-6">
              아직 관심 표시한 매물이 없어요.
            </div>
          )}
          <div className="flex flex-col gap-2">
            {interests.map((i) =>
              i.deals ? (
                <Link
                  key={i.id}
                  href={`/deals/${i.deals.id}`}
                  className="bg-white border border-gray200 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-gray900">{i.deals.title}</div>
                    <div className="text-sm text-navy font-bold mt-0.5">
                      {formatPrice(i.deals.deal_price)}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={
                      i.deals.status === "active"
                        ? { background: "#E8F8EC", color: "#1D8A44" }
                        : { background: "#F5F6F8", color: "#6B7480" }
                    }
                  >
                    {i.deals.status === "active" ? "진행중" : "마감"}
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </div>

        <div className="border-t border-gray200 pt-5">
          <div className="text-sm font-bold text-navy mb-1 flex items-center gap-1.5">
            🤝 점핑파트너
            <span className="text-xs font-medium text-gray500 bg-gray100 px-2 py-0.5 rounded-full">
              {referrals.length}명 추천함
            </span>
          </div>
          <p className="text-xs text-gray500 mb-3 leading-relaxed">
            아래 링크로 가입하면 내가 추천한 회원으로 따로 관리돼요.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-3.5 flex items-center text-sm text-gray500 truncate" style={{ height: "48px" }}>
              {typeof window !== "undefined" && refCode ? `${window.location.origin}/signup?ref=${refCode}` : ""}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${refCode}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-white font-bold rounded-xl px-4 text-sm whitespace-nowrap flex-shrink-0"
              style={{ background: "#0B2540" }}
            >
              {copied ? "복사됨 ✓" : "복사"}
            </button>
            <button
              onClick={handleShareRefLink}
              aria-label="추천 링크 공유"
              className="font-bold rounded-xl px-4 text-sm whitespace-nowrap flex-shrink-0 border-2 border-gray200 text-navy"
            >
              {shared ? "공유됨 ✓" : "공유 ↗"}
            </button>
          </div>

          {referrals.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {referrals.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white border border-gray200 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-bold text-gray900">
                      {r.member_no != null ? formatMemberNo(r.member_no) : "회원번호 없음"}
                    </div>
                    <div className="text-xs text-gray500 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("ko-KR")} 가입
                      {r.is_business && " · 사업자"}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: "#E8F8EC", color: "#1D8A44" }}
                  >
                    가입완료
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray200 pt-5">
          <button
            type="button"
            onClick={() => showToast("개발 중인 기능이에요. 곧 만나보실 수 있어요!")}
            className="w-full bg-white border border-gray200 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl leading-none">📋</span>
              <span className="text-sm font-bold text-gray900">견적함</span>
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: "#F5F6F8", color: "#6B7480" }}
            >
              준비중
            </span>
          </button>
        </div>

        <Link href="/unsubscribe" className="text-center text-xs text-gray500 underline py-2">
          알림이 필요 없으신가요? 알림 해지 · 탈퇴
        </Link>
      </div>

      <Toast message={toastMessage} />
    </main>
  );
}
