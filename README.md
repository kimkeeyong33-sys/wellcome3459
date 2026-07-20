# B2B Auction

이베이 스타일의 기업간(B2B) 경매 플랫폼 MVP입니다. Next.js(App Router) + Prisma + PostgreSQL로 구성되어 있습니다.

## 핵심 기능

- 기업 회원가입/로그인 (구매기업/판매기업 구분, 사업자정보 등록)
- 경매 등록 (시작가, 최소 입찰 단위, 즉시구매가, 시작/마감 일시)
- 실시간 입찰 (동시 입찰 시 CAS 방식으로 정합성 보장)
- 마감 시각 도달 시 자동 낙찰 처리, 즉시구매가 도달 시 즉시 낙찰
- 내 입찰 현황 / 내가 등록한 경매 조회

결제(PG) 연동은 이번 단계 범위에 포함되지 않았습니다.

## 시작하기

```bash
npm install

# .env 에 DATABASE_URL, JWT_SECRET 설정 (PostgreSQL 필요)
npx prisma migrate dev
npx tsx prisma/seed.ts   # 카테고리 시드 데이터

npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 기술 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Prisma ORM 7 + PostgreSQL (`@prisma/adapter-pg` 드라이버 어댑터 사용)
- JWT 기반 인증 (httpOnly 쿠키)
- Zod를 통한 입력값 검증

## 디렉터리 구조

```
src/
  app/
    api/            REST API 라우트 (auth, auctions, categories, me)
    auctions/[id]/  경매 상세 + 입찰 페이지
    auctions/new/   경매 등록 페이지 (판매기업)
    login/ register/ mypage/
  lib/
    prisma.ts       Prisma Client 싱글턴
    auth.ts         JWT/비밀번호 유틸
    auctionEngine.ts 입찰 처리, 마감/낙찰 로직
  context/AuthContext.tsx  클라이언트 인증 상태
prisma/
  schema.prisma     User/Company/Category/Auction/Bid 모델
  seed.ts           카테고리 시드
```

## 향후 확장 아이디어

- PG 결제 연동 (낙찰 후 결제/정산)
- 이미지 업로드 (상품 사진)
- 기업 인증 승인 플로우 (관리자 검수)
- 알림 (입찰 경쟁, 낙찰 알림 이메일/푸시)
- 자동 낙찰 처리를 cron/워커로 이관 (현재는 API 호출 시점에 지연 평가)
