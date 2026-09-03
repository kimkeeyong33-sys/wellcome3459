# PROGRESS

마지막 업데이트: 2026-09-03

새 세션을 시작할 때 이 파일을 먼저 읽고, 아래 "다음에 할 일"부터 확인하세요.

## 프로젝트 개요

덤핑점핑(JumpX 알림 MVP) — B2B 덤핑정보 알림 웹앱.
Next.js 16 (App Router) + Supabase + Tailwind CSS v4. 자세한 배포/구조 설명은 `README.md` 참고.

## 현재 상태

- 기본 브랜치: `claude/dumping-alert-app-rb20gt`
- 작업 브랜치: `claude/mypage-quote-box-menu` (기본 브랜치에서 분기)
- PR #1 (열려 있음, 아직 병합 안 됨): https://github.com/kimkeeyong33-sys/wellcome3459/pull/1
  - "마이페이지에 '견적함' 메뉴(준비중) 추가"
- 로컬 git 사용자 정보 설정 완료 (이 저장소 한정): `user.name = kimkeeyong33`, `user.email = wellcomegift@gmail.com`

## 최근 작업 (이번 세션)

1. 마이페이지(`src/app/mypage/page.tsx`)에 기존 메뉴 카드와 동일한 스타일(아이콘 + 텍스트)로 **"견적함"** 메뉴 버튼 추가, 오른쪽에 "준비중" 뱃지 부착.
2. 클릭 시 페이지 이동 없이 "개발 중인 기능이에요. 곧 만나보실 수 있어요!" 토스트만 잠깐 떴다가 사라지도록 구현.
3. 프로젝트에 기존 토스트/스낵바 컴포넌트가 없어서 `src/components/Toast.tsx`(간단한 `useToast` 훅 + `Toast` 컴포넌트)를 새로 만들어 재사용 가능하게 구성.
4. `npm install` 후 `npm run dev`로 로컬 구동 확인, Chrome으로 `/mypage` 접속해 버튼 스타일과 토스트 동작(약 2.2초 후 자동 소멸, 화면 이동 없음)을 직접 확인함.
   - 확인 당시 `.env.local`이 없어 마이페이지가 "데모 모드" 화면만 보여줬기 때문에, `isSupabaseConfigured` 체크를 임시로 우회해 화면을 확인한 뒤 정확히 원상복구했음 (`git diff`로 재확인 완료).
5. 커밋 후 `claude/mypage-quote-box-menu` 브랜치로 push, PR #1 생성.

## 다음에 할 일

- [ ] PR #1 리뷰 후 `claude/dumping-alert-app-rb20gt`로 병합
- [ ] "견적함" 실제 기능 기획/개발 (현재는 "준비중" 자리표시자만 있음) — 어떤 데이터를 담을지(예: 관심 매물의 견적 요청 내역?), 화면 구성 결정 필요
- [ ] (선택) `Toast.tsx`를 다른 화면에서도 재사용할 만한 곳이 있는지 점검 — 예: 저장 완료, 복사 완료 등 현재 텍스트로만 표시되는 상태 메시지들을 토스트로 통일할지 검토

## 개발 환경 참고사항

- 이 환경에는 기본적으로 `node_modules`가 없을 수 있음 → 작업 전 `npm install` 필요
- `.env.local`이 없으면 Supabase 미설정 상태로 동작 (`isSupabaseConfigured === false`) → 마이페이지 등 로그인 필요한 화면은 "데모 모드" 안내만 뜸. 실제 데이터로 화면 확인하려면 `.env.local.example`을 복사해 Supabase 값 채우거나, README의 "지금 바로 로컬에서 확인하기" 섹션 참고
- git 사용자 정보(user.name/email)는 이 저장소 로컬 config에만 설정돼 있음 (global 아님)
