-- ============================================================
-- 덤핑점핑 알림 MVP (JumpX) · Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에서 그대로 실행하세요.
-- ============================================================

-- 1. 회원 (휴대폰 인증 기반, Supabase Auth phone 사용)
create table if not exists public.members (
  id uuid primary key default auth.uid(),
  phone text unique not null,
  is_business boolean default false,
  business_verified boolean default false, -- 파트너 매니저가 수동으로 true 전환
  created_at timestamptz default now()
);

-- 2. 카테고리 마스터
create table if not exists public.categories (
  id serial primary key,
  name text unique not null,
  sort_order int default 0
);

insert into public.categories (name, sort_order) values
  ('냉동냉장식품', 1), ('농수축산물', 2), ('생활용품', 3), ('패션잡화', 4),
  ('화장품', 5), ('전자제품', 6), ('산업원자재', 7), ('기계설비', 8), ('기타', 9)
on conflict (name) do nothing;

-- 3. 지역 마스터 (전국 도 + 광역시)
create table if not exists public.regions (
  id serial primary key,
  name text unique not null,
  sort_order int default 0
);

insert into public.regions (name, sort_order) values
  ('서울', 1), ('부산', 2), ('대구', 3), ('인천', 4), ('광주', 5),
  ('대전', 6), ('울산', 7), ('세종', 8), ('경기', 9), ('강원', 10),
  ('충북', 11), ('충남', 12), ('전북', 13), ('전남', 14),
  ('경북', 15), ('경남', 16), ('제주', 17)
on conflict (name) do nothing;

-- 4. 회원 관심 카테고리 (다대다)
create table if not exists public.member_categories (
  member_id uuid references public.members(id) on delete cascade,
  category_id int references public.categories(id) on delete cascade,
  primary key (member_id, category_id)
);

-- 5. 회원 관심 지역 (다대다)
create table if not exists public.member_regions (
  member_id uuid references public.members(id) on delete cascade,
  region_id int references public.regions(id) on delete cascade,
  primary key (member_id, region_id)
);

-- 6. 매물 (덤핑 정보)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id int references public.categories(id),
  region_id int references public.regions(id),
  original_price numeric not null,
  deal_price numeric not null,
  total_qty int not null,
  remaining_qty int not null,
  location text,
  closes_at timestamptz not null,
  status text default 'active', -- active | closed | sold_out
  images text[] default '{}', -- 매물 사진 URL 목록 (최대 4장 권장: 대표/실물/박스/라벨)
  description text, -- 소비기한, 보관상태 등 판매자가 남긴 상세 설명
  created_at timestamptz default now()
);

-- 7. 웹 푸시 구독 정보 (브라우저/기기별로 여러 개 가능)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz default now()
);

-- 8. 알림 발송 로그
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  channel text default 'webpush', -- webpush (기기 푸시 알림, 알라미와 동일한 방식)
  status text default 'sent', -- sent | failed | clicked
  sent_at timestamptz default now()
);

-- 9. 관심 표시 ("관심있어요 · 점핑매니저 연결" 클릭 로그)
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  contacted boolean default false, -- 점핑매니저가 연락했는지 여부 (관리자 화면에서 체크)
  outcome text default 'pending', -- pending | completed | no_deal (카카오톡 채널에서의 실거래 결과)
  completed_amount numeric, -- 실제 거래 성사 금액 (매물 가격과 다를 수 있음)
  completed_at timestamptz, -- 거래 성사/불발 처리 시각
  created_at timestamptz default now(),
  unique (deal_id, member_id)
);

-- 10. 판매자 매물 등록 신청 (누구나 신청 가능, 관리자가 검토 후 승인해야 deals에 등록됨)
create table if not exists public.seller_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_phone text not null,
  category_id int references public.categories(id),
  region_id int references public.regions(id),
  product_name text not null,
  quantity int not null,
  hope_price numeric,
  description text,
  images text[] default '{}', -- 판매자가 첨부한 사진 URL 목록
  hope_duration_hours int, -- 판매자가 희망하는 마감까지 남은 시간 (관리자 승인 시 기본값으로 사용)
  status text default 'pending', -- pending | approved | rejected
  linked_deal_id uuid references public.deals(id),
  created_at timestamptz default now()
);

-- ---------------- 마이그레이션 (이미 위 스키마를 실행한 적이 있다면, 이 블록만 다시 실행해도 안전합니다) ----------------
alter table public.interests add column if not exists contacted boolean default false;
alter table public.interests add column if not exists outcome text default 'pending';
alter table public.interests add column if not exists completed_amount numeric;
alter table public.interests add column if not exists completed_at timestamptz;
alter table public.deals add column if not exists description text;
alter table public.seller_requests add column if not exists hope_duration_hours int;
update public.categories set name = '전자제품' where name = '전자부품';

-- ---------------- RLS (Row Level Security) ----------------
alter table public.members enable row level security;
alter table public.member_categories enable row level security;
alter table public.member_regions enable row level security;
alter table public.deals enable row level security;
alter table public.interests enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_self" on public.push_subscriptions
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- 본인 정보만 읽기/쓰기
create policy "members_self_select" on public.members
  for select using (auth.uid() = id);
create policy "members_self_upsert" on public.members
  for insert with check (auth.uid() = id);
create policy "members_self_update" on public.members
  for update using (auth.uid() = id);

create policy "member_categories_self" on public.member_categories
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

create policy "member_regions_self" on public.member_regions
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- 매물은 로그인한 회원 누구나 조회 가능 (공개 알림 리스트)
create policy "deals_public_select" on public.deals
  for select using (true);

-- 관심 표시는 본인 것만 생성/조회
create policy "interests_self" on public.interests
  for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- 판매자 등록 신청: 누구나(비회원 포함) 신청서는 제출 가능, 조회/승인은 관리자(서비스 키)만
alter table public.seller_requests enable row level security;
create policy "seller_requests_public_insert" on public.seller_requests
  for insert with check (true);

-- 매물/신청서에 짧은 소개 영상(최대 15초) 첨부 지원
alter table public.deals add column if not exists video_url text;
alter table public.seller_requests add column if not exists video_url text;

-- 비회원이 "관심있어요"를 누를 때 회원가입 없이 전화번호만으로 리드를 남길 수 있게 하는 테이블
create table if not exists public.quick_leads (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  phone text not null,
  contacted boolean default false,
  outcome text default 'pending', -- pending | completed | no_deal
  completed_amount numeric,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table public.quick_leads enable row level security;
create policy "quick_leads_public_insert" on public.quick_leads
  for insert with check (true);

-- "이런 재고 찾습니다" — 구매 희망(수요) 등록. 판매자 등록(seller_requests)의 반대편 짝입니다.
create table if not exists public.buy_requests (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category_id int references public.categories(id),
  region_id int references public.regions(id),
  quantity text, -- 자유 입력(예: "300박스", "5,000개")이라 숫자로 강제하지 않습니다
  hope_price numeric,
  contact_phone text not null,
  description text,
  contacted boolean default false,
  outcome text default 'pending', -- pending | matched | no_match
  created_at timestamptz default now()
);
alter table public.buy_requests enable row level security;
create policy "buy_requests_public_insert" on public.buy_requests
  for insert with check (true);

-- 점핑파트너(추천인) 기능 — 누가 누구를 추천해서 가입했는지 추적 (리워드 없는 트래킹 전용)
alter table public.members add column if not exists referred_by uuid references public.members(id);

-- 추천 링크에 UUID 대신 쓸 짧은 코드 (예: "7F3KQ9"). 공유하기 좋게 회원마다 하나씩 부여됩니다.
alter table public.members add column if not exists ref_code text unique;

-- ---------------- Storage (매물 사진 저장용) ----------------
-- 아래는 SQL Editor가 아니라 Supabase 대시보드 → Storage 메뉴에서 수동으로 설정하세요:
-- 1. "New bucket" → 이름: deal-images, Public bucket 체크 (누구나 읽기 가능하게)
-- 2. 업로드는 서버(API 라우트, service_role 키)를 통해서만 이루어지므로 별도 정책 설정은 필요 없습니다.
-- 3. 짧은 소개 영상도 같은 deal-images 버킷에 함께 저장됩니다 (별도 버킷 생성 불필요).
