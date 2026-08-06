# 캐시티켓 (CashTicket)

카카오톡을 쓸 줄 아는 사람이라면 누구나 쓸 수 있는 소상공인용 금액권(선불 티켓) 앱입니다.
사장님이 금액권을 발행해 링크 하나로 전달하면, 고객은 로그인 없이 그 링크만으로 티켓을
저장하고 · 매장에서 사용하고 · 남은 잔액을 다른 사람에게 선물할 수 있습니다.
30~60대도 헤매지 않도록 글자를 크게, 단계를 최소화해서 만들었습니다.

Next.js(App Router) + Supabase + Tailwind CSS로 만들었습니다.

## 지금 바로 로컬에서 확인하기 (Supabase 없이도 동작)

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속. `.env.local`이 없으면 서버가 메모리에 임시로 데이터를 저장하는
데모 모드로 동작하니, 발행 → 전달 → 스캔결제 → 선물하기까지 전체 흐름을 그대로 눌러볼 수
있어요 (단, 서버를 재시작하면 초기화됩니다).

## 실제 서비스로 배포하기

### 1. Supabase 프로젝트 만들기

1. https://supabase.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** → `supabase/cashticket_schema.sql` 내용 전체 복사해서 실행
   (매장·티켓·거래내역 테이블이 한 번에 생성됩니다)
3. **Project Settings → API**에서 아래 3개 값 복사:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (절대 외부 노출 금지, 서버에서만 사용)

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

위에서 받은 값을 채워 넣으세요.

### 3. 결제 연동 — 토스페이먼츠 (선택, 비워두면 데모 결제로 동작)

사장님이 "고객 결제 받기"로 티켓을 발행하면 고객이 실제로 결제하고 금액권을 받습니다.

1. https://developers.tosspayments.com 가입 → 상점(무료) 개설
2. **연동 키** 메뉴에서 클라이언트 키 · 시크릿 키 복사
3. `.env.local`의 `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`에 각각 입력
4. 키를 넣지 않으면 결제 페이지가 자동으로 **데모 결제**(실제 청구 없이 즉시 완료 처리)로 동작해서, 계약 전에도 전체 흐름을 테스트할 수 있어요.

### 4. 사업자등록 인증 — 국세청 API (선택, 비워두면 인증 기능이 비활성화됨)

1. https://www.data.go.kr 접속 → "국세청_사업자등록정보 진위확인 및 상태조회 서비스" 검색 → 활용신청(무료, 승인까지 최대 1~2일)
2. 발급된 일반 인증키(디코딩된 값)를 `.env.local`의 `BIZNO_API_KEY`에 입력
3. 매장 가입 시(또는 가입 후 `/owner/settings`에서) 사업자등록번호·개업일자·대표자명을 입력하면 국세청에 즉시 조회해 통과 시 고객 화면에 "인증 매장" 배지가 표시돼요.

### 5. SEO / 사이트맵용 실제 배포 주소 설정

`.env.local`의 `NEXT_PUBLIC_SITE_URL`에 실제 배포 주소를 넣어주세요. 이 값이 QR·링크에
그대로 사용되므로 배포 전 반드시 실제 도메인으로 채워야 합니다.

### 6. Vercel로 배포

1. 이 코드를 GitHub 저장소에 push
2. https://vercel.com 에서 **New Project** → 방금 만든 저장소 선택
3. **Environment Variables**에 `.env.local`과 동일한 값들을 그대로 입력
4. Deploy 클릭 → 몇 분 후 `https://프로젝트명.vercel.app` 주소로 접속 가능

## 전체 흐름

### 사장님

1. **매장 등록** (`/owner/signup`) — 매장 이름·사장님 성함·휴대폰 번호·4자리 비밀번호만 입력하면 끝. 사업자등록증 없이 바로 시작. 가입 화면에서 (선택으로) 사업자등록번호를 입력하면 국세청 API로 즉시 인증돼요.
2. **티켓 발행** (`/owner/tickets/new`) — "무료 증정"과 "고객 결제 받기" 중 방식을 고르고, 금액(빠른 선택 버튼)과 유효기간(1개월~1년)을 정해 발행.
   - **무료 증정**: 바로 발행돼서 전달 화면으로 이동.
   - **고객 결제 받기**: 결제 링크(`/pay/[code]`)가 만들어지고, 고객이 결제를 마쳐야 티켓이 발급돼요 — 이게 사업계획서의 핵심인 "선결제로 운영자금 확보"예요.
3. **고객에게 전달** (`/owner/tickets/[code]`, 결제형은 `/owner/payment-requests/[code]`) — QR코드와 6자리 코드가 함께 표시되고, "카카오톡 등으로 전달하기" 버튼을 누르면 기기의 공유 시트(카카오톡 포함)로 바로 보낼 수 있어요. 별도 카카오 API 키나 심사 없이 동작합니다 (Web Share API 사용, 미지원 브라우저는 링크 복사로 대체). 결제형은 고객이 결제를 마치면 화면이 자동으로 완료 처리돼요.
4. **QR 스캔 · 결제 확인** (`/owner/scan`) — 카메라로 고객 화면의 QR을 스캔하거나, 6자리 코드를 직접 입력해 조회 → 결제 금액 입력 → 확정하면 잔액이 즉시 차감돼요.
5. **정산 대시보드** (`/owner/dashboard`) — 발행액·사용액·미사용잔액과 최근 거래내역을 한눈에 확인. 사업자등록 미인증 상태면 `/owner/settings`로 이동하는 배너가 떠요.
6. **매장 정보 관리** (`/owner/settings`) — 매장 주소·영업시간·전화번호를 등록하면 고객 결제·티켓 화면에 노출돼요(비워두면 표시 안 함). 상품·가격표(`/owner/menu`)도 여기서 관리해요 — 처음 보는 매장에 결제하기 전 고객이 "어디에 있고 뭘 파는 가게인지" 확인할 수 있게 하기 위함이에요.

### 고객

1. **티켓 받기** (`/t/[코드]`) — 카카오톡 등으로 받은 링크를 열면 자동으로 "내 모아보기"에 저장돼요. 로그인 필요 없음(이 기기에 보관). 결제 링크(`/pay/[코드]`)라면 매장 위치·영업시간·메뉴를 먼저 확인하고, 이용약관·환불 규정에 동의한 뒤 결제해야 티켓을 받아요.
2. **모아보기** (`/my`) — 저장된 모든 티켓의 잔액과 소멸 임박 여부(14일 이내 주황색 경고)를 한 번에 확인.
3. **매장 방문** — 같은 `/t/[코드]` 화면에 있는 QR을 매장 직원에게 보여주면 끝. 사업자등록 인증된 매장은 배지가 함께 표시돼요.
4. **잔액 사용** — 매장에서 스캔·확정하면 일부 금액만 차감되고 나머지는 계속 남아있어요(분할 사용 가능).
5. **선물하기** (`/t/[코드]/gift`) — 남은 잔액 중 원하는 만큼 새 티켓으로 나눠 다른 사람에게 링크로 보낼 수 있어요. 받은 사람도 똑같이 모아보기에서 확인할 수 있습니다.

## 규제 관련 설계 메모 (사업계획서 3-1장 반영)

MVP는 **단일 매장 전용 티켓만** 발행합니다(매장 간 잔액 교차사용 없음). 전자금융거래법상
선불전자지급수단 등록 면제 요건 ①(단일 가맹점 전용)을 그대로 충족하도록, `/api/owner/tickets/redeem`이
결제를 발행한 매장(`store_id`)과 항상 대조해 다른 매장에서는 사용할 수 없도록 막고 있어요.
멀티 매장 확장은 발행잔액 30억원 · 연 발행액 500억원 임계치 관리(면제 사유 ②)가 필요한
2단계 이후 항목입니다.

## 기술 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase (Postgres) — API 라우트가 service role 키로만 접근 (RLS로 anon 직접 접근 차단)
- `qrcode` (QR 생성, 오프라인) / `jsqr` (카메라 QR 스캔)
- `@tosspayments/payment-sdk` — 결제창 연동 (키 미설정 시 데모 결제로 대체)
- 국세청 사업자등록정보 진위확인 API (공공데이터포털) — 사업자 인증

## 디렉터리 구조

```
src/
  app/
    page.tsx                            홈 (사장님 / 고객 진입점)
    owner/
      signup/page.tsx                   ① 매장 등록 (+ 선택: 사업자등록 인증)
      login/page.tsx                    사장님 로그인
      settings/page.tsx                 매장 위치·연락처 + 사업자등록 인증 (가입 후에도 가능)
      menu/page.tsx                     상품·가격표 관리 (등록/삭제)
      dashboard/page.tsx                정산 대시보드 + 최근 내역
      tickets/new/page.tsx              ② 티켓 발행 (무료 증정 / 고객 결제 받기)
      tickets/[code]/page.tsx           ③ 고객에게 전달 (QR + 카카오톡 공유) — 무료 증정
      payment-requests/[code]/page.tsx  ③ 결제 링크 전달 — 결제 대기 상태를 자동 갱신
      scan/page.tsx                     ④ QR 스캔 · 결제 확인
    pay/[code]/page.tsx                 고객: 결제하고 티켓 받기 (토스페이먼츠 또는 데모 결제)
    pay/[code]/success/page.tsx         결제 성공 콜백 → 서버 승인 → 티켓 발급
    pay/[code]/fail/page.tsx            결제 실패/취소 화면
    t/[code]/page.tsx                   고객: ① 티켓 받기 · ③ 매장 방문(QR 제시) · ④ 사용내역
    t/[code]/gift/page.tsx              고객: ⑤ 선물하기
    my/page.tsx                         고객: ② 모아보기
    terms/page.tsx, privacy/page.tsx    이용약관 · 개인정보처리방침
    api/
      owner/signup/route.ts             매장 등록 (+ 사업자등록 진위확인)
      owner/login/route.ts              사장님 로그인
      owner/verify-business/route.ts    사업자등록 인증 (가입 후)
      owner/store-info/route.ts         매장 주소·영업시간·전화번호 조회/저장
      owner/products/route.ts           상품·가격표 조회/등록
      owner/products/[id]/route.ts      상품 삭제
      owner/dashboard/route.ts          정산 요약 + 최근 거래
      owner/tickets/route.ts            티켓 발행 (무료 증정)
      owner/tickets/redeem/route.ts     QR 스캔 후 결제 확정 (잔액 차감)
      owner/payment-requests/route.ts   결제 요청 생성 (고객 결제 받기)
      payment-requests/[code]/route.ts  결제 요청 조회 (공개)
      payment-requests/[code]/confirm/route.ts  결제 승인 처리 → 티켓 발급
      tickets/[code]/route.ts           티켓 조회 (공개)
      tickets/[code]/gift/route.ts      선물하기 (잔액 분할)
  components/
    cashticket/TicketQR.tsx             QR 표시 (qrcode 라이브러리, 오프라인 생성)
    cashticket/QRScanner.tsx            카메라 QR 스캔 (jsQR)
    cashticket/StoreInfoCard.tsx        결제·티켓 화면에 매장 위치·연락처·메뉴 표시
    InstallAppButton.tsx                홈 화면에 추가하기 버튼
  lib/
    cashticket/code.ts                  6자리 티켓 코드 생성
    cashticket/wallet.ts                고객 모아보기 · 사장님 로그인 세션 (localStorage)
    cashticket/adminClient.ts           Supabase service role 클라이언트
    cashticket/demoStore.ts             Supabase 미설정 시 메모리 데모 저장소
    cashticket/toss.ts                  토스페이먼츠 결제 승인(confirm) 서버 호출
    cashticket/nts.ts                   국세청 사업자등록 진위확인 서버 호출
    cashticket/storeInfo.ts             매장 공개 정보(위치·연락처·메뉴) 조회 공용 로직
    format.ts                           금액 포맷 유틸
public/
  manifest.json                         PWA 매니페스트 (홈 화면 추가용)
supabase/
  cashticket_schema.sql                 DB 스키마 (그대로 실행하면 됨)
```

## 결제 보안 메모

`/api/payment-requests/[code]/confirm`은 클라이언트가 보낸 금액을 그대로 믿지 않고, 서버에
저장된 결제 요청 금액(`amount`)과 반드시 대조한 뒤에만 토스페이먼츠 승인 API를 호출합니다.
승인이 실제로 성공(status `DONE`)했을 때만 티켓을 발급하며, 동일한 결제 요청에 대한 중복 호출은
멱등하게 처리됩니다(이미 발급된 티켓 코드를 그대로 반환).

## 향후 확장 아이디어

- 사장님 인증을 문자 인증(OTP) 기반으로 강화 (현재는 전화번호+4자리 비밀번호)
- 카카오 알림톡 또는 웹푸시로 소멸임박·결제확인·선물도착 알림
- 멀티 매장·프랜차이즈 지원 (선불전자지급수단 등록/위탁 구조 확정 후)
- AI 기반 휴면 고객 재방문 유도, 인기 상품 예측 (사업계획서 6장)
- 스탬프 적립·단골 등급 등 마케팅 기능
