# SynCargo 데모

포워딩 실무자용 B2B SaaS 데모. Outlook 메일을 읽어 화주·업무 건에 연결하고, 근거 문장과 함께 정리한다.
지금은 **가짜 데이터(mock)** 로 클릭 시연만 된다. 실제 메일 연동·AI·DB는 없다.

## 폴더 구조 (npm workspaces)

```
syncargo_sy/
├─ frontend/   @syncargo/frontend — Next.js 앱 (화면)
│  ├─ app/          라우트: login, home, shippers, cases, review, settings …
│  ├─ components/   공통 부품(app/) + shadcn/ui(ui/)
│  ├─ lib/          화면 전용: 날짜 표시, 라벨, 링크, 시연용 클라이언트 상태(demo-state)
│  └─ public/figma  Figma에서 받은 아이콘
└─ backend/    @syncargo/backend — 데이터·도메인 계층
   └─ src/
      ├─ types.ts   DB 테이블과 1:1 대응하는 타입
      ├─ domain.ts  기준일·D-day·단계 순서·상태 우선순위
      ├─ data.ts    프론트엔드가 쓰는 유일한 데이터 진입점 (async 함수)
      └─ mock/      가짜 데이터 (화주 8, 건 8+완료 16, 메일 16, 검토 4)
```

### "백엔드"의 현재 상태

- `backend/`는 **별도로 떠 있는 서버가 아니다.** Next.js 서버(서버 컴포넌트·Server Action)가 `@syncargo/backend/data`를 직접 불러 실행한다.
- 지금은 메모리 안의 mock 데이터를 돌려줄 뿐이라 **저장되는 것이 없다.** 화면에서 바꾼 내용(검토 확정, 메모 등)은 `frontend/lib/demo-state.tsx`의 브라우저 상태라 새로고침하면 사라진다.
- 클라이언트 컴포넌트는 backend에서 `import type`만 한다. mock 데이터는 브라우저 번들에 들어가지 않는다.

### 나중에 백엔드를 채울 자리

| 할 일 | 위치 |
|---|---|
| Supabase(Postgres) 조회로 교체 | `backend/src/data.ts` 내부만 바꾸면 화면은 그대로 |
| 저장(검토 확정·메모·메일 밖 정보) | `demo-state`의 액션을 Server Action → backend 함수로 |
| Microsoft Graph 메일 동기화 (델타 쿼리 + 웹훅) | `backend/` 아래 새 모듈 (예: `src/graph/`) |
| AI 추출 (JSON 출력 + 근거 문장 위치) | `backend/` 아래 새 모듈 (예: `src/extract/`) |

웹훅 수신·주기 동기화처럼 오래 도는 작업이 생기면, 그때 backend를 별도 서버(또는 Supabase Edge Function)로 띄우는 것을 검토한다.

## 실행

루트에서:

```bash
npm install
npm run dev        # http://localhost:3000 → 로그인 화면
npm run typecheck  # backend + frontend 타입 검사
npm run lint
npm run build
```

기준 날짜는 2026-11-16(월)로 고정 (`backend/src/domain.ts`의 `TODAY`).
