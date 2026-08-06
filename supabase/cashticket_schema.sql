-- ============================================================
-- 캐시티켓(CashTicket) · Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에서 그대로 실행하세요.
-- 기존 덤핑점핑 스키마(schema.sql)와 같은 프로젝트에 함께 실행해도
-- 테이블명이 겹치지 않아 안전합니다.
-- ============================================================

-- 1. 매장 (사장님)
-- MVP는 "단일 매장 전용 티켓"만 발행합니다 (전자금융거래법상 선불전자지급수단
-- 등록 면제 요건 ① 충족 — 사업계획서 3-1장 참고). 매장 간 잔액 교차사용은 없습니다.
create table if not exists public.ct_stores (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  store_name text not null,
  phone text unique not null,
  pin text not null, -- 4자리 숫자 비밀번호 (MVP: 평문 저장, 서버 API 경유로만 조회/검증)
  category text,
  business_number text, -- 사업자등록번호 (선택 입력)
  business_open_date text, -- 개업일자 (YYYYMMDD) — 국세청 진위확인 조회용
  business_rep_name text, -- 대표자 성명 — 국세청 진위확인 조회용
  business_verified boolean not null default false, -- 국세청 진위확인 API 통과 여부
  created_at timestamptz default now()
);

-- 2. 티켓 (금액권)
-- 매장이 발행하거나(발행 티켓), 다른 티켓에서 잔액을 나눠 선물했을 때(parent_ticket_id) 생성됩니다.
create table if not exists public.ct_tickets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, -- 6자리 사람이 읽기 쉬운 코드 (QR·링크에 사용)
  store_id uuid not null references public.ct_stores(id) on delete cascade,
  store_name text not null, -- 매장명 스냅샷 (매장 정보가 바뀌어도 발행 당시 표기 유지)
  issued_amount numeric not null,
  balance numeric not null,
  memo text,
  parent_ticket_id uuid references public.ct_tickets(id),
  status text not null default 'active', -- active | expired
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 이미 이전 버전 스키마로 ct_stores를 만든 적이 있다면 새 컬럼만 추가합니다.
alter table public.ct_stores add column if not exists business_number text;
alter table public.ct_stores add column if not exists business_open_date text;
alter table public.ct_stores add column if not exists business_rep_name text;
alter table public.ct_stores add column if not exists business_verified boolean not null default false;

create index if not exists ct_tickets_store_id_idx on public.ct_tickets(store_id);
create index if not exists ct_tickets_code_idx on public.ct_tickets(code);

-- 3. 사용/발행/선물 내역
create table if not exists public.ct_transactions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.ct_tickets(id) on delete cascade,
  type text not null, -- issue | use | gift_out | gift_in
  amount numeric not null,
  memo text,
  created_at timestamptz default now()
);

create index if not exists ct_transactions_ticket_id_idx on public.ct_transactions(ticket_id);

-- 4. 결제 요청 (고객이 실제로 돈을 내고 금액권을 받는 "선결제" 흐름)
-- 사장님이 결제형으로 발행을 요청하면 여기에 pending으로 먼저 쌓이고,
-- 토스페이먼츠 결제 승인이 완료된 뒤에야 ct_tickets가 생성됩니다.
create table if not exists public.ct_payment_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  store_id uuid not null references public.ct_stores(id) on delete cascade,
  store_name text not null,
  amount numeric not null,
  valid_days int not null,
  memo text,
  status text not null default 'pending', -- pending | paid | canceled
  order_id text, -- 토스페이먼츠에 전달한 주문번호 (승인 시 기록)
  ticket_id uuid references public.ct_tickets(id), -- 결제 완료 후 발급된 티켓
  created_at timestamptz default now(),
  paid_at timestamptz
);

create index if not exists ct_payment_requests_code_idx on public.ct_payment_requests(code);
create index if not exists ct_payment_requests_store_id_idx on public.ct_payment_requests(store_id);

-- RLS: 모든 읽기/쓰기는 서버 API(route.ts, service role 키)를 통해서만 이루어지므로
-- anon 키로는 직접 접근하지 못하도록 막습니다.
alter table public.ct_stores enable row level security;
alter table public.ct_tickets enable row level security;
alter table public.ct_transactions enable row level security;
alter table public.ct_payment_requests enable row level security;
-- (정책을 추가하지 않으면 anon 키 요청은 기본적으로 모두 거부됩니다.)
