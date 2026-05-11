# Homeboard - 프로젝트 계획

> 브라우저 홈페이지로 사용하는 개인 북마크 매니저.
> 폴더 구조로 링크를 관리하고, 데이터는 로컬 JSON 파일로 저장·동기화한다.

---

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트엔드 | React + TypeScript + Vite |
| 백엔드 | Node.js + Express |
| Drag & Drop | @dnd-kit/core |
| 스타일링 | Tailwind CSS |
| 데이터 | bookmarks.json (Windows 로컬 파일) |

---

## 프로젝트 구조

```
homeboard/
├── backend/
│   ├── src/
│   │   └── index.ts          # Express 서버 진입점
│   ├── data/
│   │   └── bookmarks.json    # 실제 데이터 파일
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FolderNode.tsx    # 폴더 (재귀 렌더링)
│   │   │   ├── LinkNode.tsx      # 링크 아이템
│   │   │   └── ItemModal.tsx     # 추가/수정 모달
│   │   ├── hooks/
│   │   │   └── useBookmarks.ts   # API 호출 및 상태 관리
│   │   ├── types/
│   │   │   └── index.ts          # 공통 타입 정의
│   │   └── App.tsx
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## 데이터 구조 (bookmarks.json)

```json
{
  "version": 1,
  "tree": [
    {
      "id": "folder-1",
      "type": "folder",
      "name": "개발",
      "isOpen": true,
      "children": [
        {
          "id": "link-1",
          "type": "link",
          "name": "GitHub",
          "url": "https://github.com",
          "favicon": "https://github.com/favicon.ico"
        },
        {
          "id": "folder-2",
          "type": "folder",
          "name": "문서",
          "isOpen": false,
          "children": []
        }
      ]
    }
  ]
}
```

### 타입 정의

```typescript
type BookmarkLink = {
  id: string;
  type: "link";
  name: string;
  url: string;
  favicon?: string;
};

type BookmarkFolder = {
  id: string;
  type: "folder";
  name: string;
  isOpen: boolean;
  children: (BookmarkFolder | BookmarkLink)[];
};

type BookmarkTree = {
  version: number;
  tree: (BookmarkFolder | BookmarkLink)[];
};
```

---

## API 설계

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/bookmarks` | bookmarks.json 읽어서 트리 반환 |
| PUT | `/api/bookmarks` | 트리 전체를 받아서 파일에 저장 |

> 노드 단위 CRUD 없이 트리 전체를 한 번에 PUT하는 단순한 구조.
> 데이터 크기가 작으므로 충분하고, 클라이언트 상태 관리도 단순해진다.

---

## 주요 기능

### 트리 렌더링 (재귀)
```
App
└── Tree
    └── FolderNode (재귀)
        ├── 폴더 헤더 (펼치기/접기, 수정 버튼, 삭제 버튼)
        └── children
            ├── FolderNode (중첩 폴더)
            └── LinkNode (favicon + 이름 + 링크)
```

### 저장 흐름
```
화면에서 변경 (추가/수정/삭제/드래그)
  → 로컬 상태(React state) 업데이트
  → PUT /api/bookmarks 자동 호출
  → Express가 bookmarks.json에 저장
  → 파일과 화면 항상 동기화
```

### Drag & Drop
- 같은 레벨 내 순서 변경
- 다른 폴더로 이동
- 드롭 완료 후 즉시 파일 저장

---

## 개발 단계

### Phase 1 — 기본 세팅
- [ ] Express 서버 세팅 (GET/PUT `/api/bookmarks`)
- [ ] bookmarks.json 읽기/쓰기
- [ ] React + Vite 앱 세팅
- [ ] 트리 재귀 렌더링
- [ ] 폴더 펼치기/접기

### Phase 2 — CRUD
- [ ] 폴더 추가·수정·삭제
- [ ] 링크 추가·수정·삭제
- [ ] favicon 자동 로드 (`{domain}/favicon.ico`)
- [ ] 변경 시 PUT 자동 호출 → 파일 즉시 반영

### Phase 3 — Drag & Drop
- [ ] @dnd-kit 세팅
- [ ] 같은 레벨 내 순서 변경
- [ ] 다른 폴더로 이동
- [ ] 드롭 후 즉시 파일 저장

### Phase 4 — 마무리
- [ ] 브라우저 홈페이지를 `http://localhost:3000` 으로 설정
- [ ] JSON export 버튼 (백업용)
- [ ] JSON import 버튼 (복원용)
- [ ] README 작성 (실행 방법 등)

---

## 실행 방법

```bash
# 백엔드 실행
cd backend
npm install
npm run dev   # http://localhost:4000

# 프론트엔드 실행
cd frontend
npm install
npm run dev   # http://localhost:3000
```

> 브라우저 홈페이지를 `http://localhost:3000` 으로 설정하면
> 브라우저를 열 때마다 Homeboard가 바로 뜬다.