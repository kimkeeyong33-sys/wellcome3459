# PROGRESS

마지막 업데이트: 2026-09-03

새 세션을 시작할 때 이 파일을 먼저 읽고, 아래 "다음에 할 일"부터 확인하세요.

## 프로젝트 개요

덤핑점핑(JumpX 알림 MVP) — B2B 덤핑정보 알림 웹앱.
Next.js 16 (App Router) + Supabase + Tailwind CSS v4. 자세한 배포/구조 설명은 `README.md` 참고.

## 현재 상태

- 기본 브랜치: `claude/dumping-alert-app-rb20gt`
- 열려 있는 PR: 없음
- 병합 완료 (기본 브랜치에 모두 반영됨): PR #1(견적함 메뉴+Toast), #2(회원가입 카카오 상단배치+업체명), #3(PWA 설치 배너 수정), #4(회원번호+추천 링크 공유), #5(프로필 완성하기+사업자등록증 첨부/인증)
  - PR #2와 #3이 `src/app/signup/page.tsx`의 같은 위치를 수정했지만 머지 시 충돌 없이 둘 다 정상 반영됨 (순서: 헤더 → 설치 배너 → 카카오 로그인 카드 → 카테고리 선택)
- 로컬 git 사용자 정보 설정 완료 (이 저장소 한정): `user.name = kimkeeyong33`, `user.email = wellcomegift@gmail.com`

## 최근 작업 (이번 세션, 시간순)

1. **마이페이지 "견적함" 메뉴** — 기존 카드 스타일로 메뉴 버튼 추가, 클릭 시 토스트만 표시(이동 없음). 새 `src/components/Toast.tsx` 컴포넌트 도입. → PR #1, 병합됨.
2. **회원가입 화면 개선** — 카카오 로그인을 최상단으로 옮기고 크게(문구: "카카오로 3초 만에 시작하기"), 휴대폰번호 입력 아래에 "업체명 (선택)" 필드 추가. → PR #2, 병합됨.
3. **PWA 설치 배너 버그 수정** — 서비스워커가 회원가입 완료 후에만 등록되던 문제 발견 → `AppShell`에서 첫 로드 시 바로 등록하도록 이동, 회원가입 화면에도 `InstallAppButton` 추가. → PR #3, 병합됨.
4. **회원번호 + 추천 링크 공유** — `members.member_no`(자동증가, "JX-00042" 표시) 추가, 마이페이지/관리자 화면에 노출, 점핑파트너 목록의 마스킹된 전화번호를 회원번호로 대체. 추천 링크에 `navigator.share` 공유 버튼 추가. → PR #4, 병합됨.
5. **프로필 완성하기 + 사업자등록증 인증** — 마이페이지에 상호명/성명/이메일(전부 선택) 저장 섹션과 사업자등록증 업로드(비공개 Storage 버킷, `members.business_license_path`) 추가. 업로드하면 "인증 대기중" 상태가 되고, 관리자가 서명 URL로 열람 후 "인증 완료 처리"하면 "✓ 인증된 사업자" 배지가 마이페이지/관리자 회원 목록/리드 목록에 표시됨. 병합 전 최종 점검에서 `members_self_update` RLS가 컬럼을 구분하지 않아 회원이 직접 자기 `business_verified`를 켤 수 있는 구멍을 발견 → `protect_business_verified` 트리거로 service_role이 아닌 변경은 무시하도록 막음. → PR #5, 병합됨.

## 다음에 할 일

- [x] Supabase 대시보드 → Storage에 `business-licenses` 버킷 생성 완료 (2026-09-03, 사용자 확인)
- [ ] 실제 Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql`의 마이그레이션 블록을 아직 실행 안 했다면 실행 필요 — `member_no`, `name`/`email`/`business_license_path` 컬럼과 `protect_business_verified` 트리거까지 전부 포함 (이 세션엔 연결된 Supabase 프로젝트가 없어 로컬에서 직접 검증하지 못했음)
- [ ] 위 두 가지가 끝나면, 실제 업로드 → 관리자 열람 → 인증 완료 처리까지 전체 흐름을 한 번 직접 확인해보는 걸 권장
- [ ] "견적함" 실제 기능 기획/개발 (현재는 "준비중" 자리표시자만 있음)
- [ ] (선택) `Toast.tsx`를 다른 화면에서도 재사용할 만한 곳이 있는지 점검

## 개발 환경 참고사항

- 이 환경에는 기본적으로 `node_modules`가 없을 수 있음 → 작업 전 `npm install` 필요
- `.env.local`이 없으면 Supabase 미설정 상태로 동작 (`isSupabaseConfigured === false`) → 마이페이지 등 로그인 필요한 화면은 "데모 모드" 안내만 뜸. 실제 데이터로 화면 확인하려면 `.env.local.example`을 복사해 Supabase 값 채우거나, README의 "지금 바로 로컬에서 확인하기" 섹션 참고
- git 사용자 정보(user.name/email)는 이 저장소 로컬 config에만 설정돼 있음 (global 아님)
- PR을 만들면 Vercel이 자동으로 프리뷰를 배포함 (GitHub 커밋 상태 체크 "Vercel" 또는 PR 코멘트에서 링크 확인). 프리뷰 URL은 Vercel 배포 보호(SSO)가 걸려 있어 접속 시 본인 Vercel 계정 로그인이 필요할 수 있음
