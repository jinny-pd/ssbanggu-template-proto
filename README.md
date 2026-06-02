# 쓰방꾸 템플릿 프로토타입

## 개요

템플릿 기반 온보딩 플로우를 검증하기 위한 React 프로토타입.
사용자가 평면도 템플릿을 선택하고, 영역을 편집하고, 가구를 자동 배치하는 흐름을 구현.

- **Vercel 배포 URL:** `https://ssbanggu-template-proto.vercel.app/`
- **GitHub 레포:** `jinny-pd/ssbanggu-template-proto`
- **로컬 개발 서버:** `npm run dev` → `http://localhost:3003/`
- **피그마 파일 키:** `cMA0a5aekVSEQJS8p1rugh`

---

## 화면 구성 및 플로우

```
홈 (/)
 ├── 튜토리얼 카드 클릭 (step = null)  → 방 추가하기 (/add-room)
 │    └── 템플릿 사용 버튼              → 템플릿 영역 편집 (/template-room)
 │         └── 이대로 사용하기           → 가구 자동 배치 (바텀시트)
 │              └── 배치안 확정          → 온보딩 완료 (/onboarding-done)
 │                   └── 백 버튼         → 홈 (온보딩 초기화)
 │
 └── 튜토리얼 카드 클릭 (step = 'area') → 템플릿 영역 편집 (/template-room, autoArrange: true)
```

### 온보딩 Step 상태 (localStorage: `ssOnboardingStep`)

| 값 | 튜토리얼 카드 문구 | 이동 화면 |
|---|---|---|
| `null` | 템플릿으로 우리 집 만들어보기 | `/add-room` |
| `'template'` | 방 영역을 지정해 볼 차례예요 | `/template-room` |
| `'area'` | 방에 어울리는 가구를 추천해 드릴게요 | `/template-room` (자동배치 진입) |

---

## 파일 구조

```
ssbanggu-template-proto/
├── src/
│   ├── App.jsx                  # 라우팅 + 반응형 스케일링
│   ├── main.jsx                 # 앱 진입점, 세션 초기화
│   ├── index.css                # 전역 스타일, phone-inner CSS
│   ├── components/
│   │   └── PhoneShell.jsx       # 375×812 폰 프레임 래퍼
│   ├── screens/
│   │   ├── Home.jsx             # 홈 화면 (3D 뷰 + 바텀시트)
│   │   ├── AddRoom.jsx          # 방 추가하기 (템플릿 목록)
│   │   ├── TemplateRoom.jsx     # 영역 편집 + 가구 자동 배치
│   │   └── OnboardingDone.jsx   # 온보딩 완료
│   └── assets/
│       ├── icons/               # SVG 아이콘
│       └── images/              # 방 이미지, 상품 이미지 등
├── index.html                   # PWA 메타 태그 포함
├── vite.config.js               # 로컬 개발용 (singlefile 포함)
├── vite.config.deploy.js        # Vercel 배포용
└── vercel.json                  # HashRouter 리라이트 설정
```

---

## 빌드 및 배포

```bash
# 로컬 개발
npm run dev

# Vercel 배포용 빌드
npm run build

# 단일 HTML 파일 내보내기 (오프라인 전달용)
npm run build:html   # → dist/index.html 하나로 패키징
```

**배포:** `main` 브랜치에 push하면 Vercel이 자동으로 재배포.

---

## 반응형 처리 (모바일 대응)

모바일에서 375×812 고정 디자인을 화면에 맞게 스케일링.

- `App.jsx` — `Math.max(innerWidth/375, innerHeight/812)` 비율로 스케일
- `PhoneShell` 내부 `phone-inner` — 상단 50px(가짜 상태바)를 위로 밀어 탑바가 iOS 상태바 바로 아래에 위치
- `--phone-inner-bottom` CSS 변수 — 하단 콘텐츠 잘림 방지
- PWA 모드 (`apple-mobile-web-app-status-bar-style: default`) — 홈 화면 추가 시 탑바 노출

---

## 개발 시 필수 확인 사항

### 1. 디자인 참고 — Figma MCP 연결 필수

디자인을 불러오거나 구현할 때는 **반드시 Figma MCP를 연결**해서 작업할 것.
노드 ID를 통해 정확한 스펙(크기, 컬러, 간격, 컴포넌트 구조)을 확인하고 구현해야 픽셀 오차를 줄일 수 있음.

```
피그마 URL 형식:
https://www.figma.com/design/{fileKey}/...?node-id={nodeId}

MCP 도구: mcp__claude_ai_Figma__get_design_context
```

### 2. 컴포넌트 선택 — ODS 플러그인 참고

버튼, 칩, 바텀시트 등 UI 컴포넌트를 구현할 때는 **ODS(오늘의집 디자인 시스템) 플러그인**을 참고할 것.
컴포넌트 이름, props, 토큰을 ODS 기준으로 선택해야 디자인 시스템 일관성이 유지됨.

```
ODS 플러그인 호출: /ods
MCP 도구: mcp__plugin_bucketplace-product-design_ods-prototype__*
```

---

## 주요 색상 및 토큰

| 역할 | 값 |
|---|---|
| 앱 배경 (다크) | `#222222` |
| 앱 배경 (라이트 / add-room) | `#ffffff` |
| 주요 액션 컬러 | `#00a1ff` |
| 영역 편집 (파란 점선) | `rgba(0,161,255,0.20)` + `#00a1ff` |
| 텍스트 기본 | `#141414` |
| 텍스트 보조 | `#8c8c8c` |
