# 인터랙션 & 애니메이션 스펙

> ssbanggu-template-proto 주요 인터랙션 및 전환 애니메이션 명세.
> 구현 기준: React inline style + CSS transition

---

## 공통 이징 값

| 이름 | 값 | 용도 |
|---|---|---|
| `ease-spring` | `cubic-bezier(0.32, 0.72, 0, 1)` | 바텀시트 슬라이드, 스낵바 등 주요 전환 |
| `ease-standard` | `ease-in-out` | 일반 페이드, 크기 변화 |
| `ease-out` | `ease-out` | 등장 애니메이션 |

---

## 1. 홈 화면 (`/`)

### 1-1. 튜토리얼 카드

| 항목 | 값 |
|---|---|
| 위치 | `position: absolute; top: 106px; left: 50%` |
| 배경 | `rgba(0,0,0,0.15)` + `backdrop-filter: blur(2.5px)` |
| 카드 닫기 (X 버튼) | `cardVisible → false` (React state, 즉시 언마운트) |
| 카드 탭 | step에 따라 화면 전환 (플로우 참고) |

### 1-2. 백 버튼 (탑바)

- `localStorage.removeItem('ssOnboardingStep')` → step 초기화
- `cardVisible → true` → 튜토리얼 카드 재노출
- **애니메이션 없음** (즉시 상태 변경)

---

## 2. 방 추가하기 (`/add-room`)

### 2-1. 템플릿 사용 버튼

- 탭 → `/template-room` 이동
- **애니메이션 없음** (React Router 즉시 전환)

---

## 3. 템플릿 영역 편집 (`/template-room`)

### 3-1. 탑바 전환 (영역 편집 ↔ 자동배치)

`defaultRoomVisible` 상태에 따라 탑바 내용이 달라짐.

| 상태 | 탑바 구성 |
|---|---|
| `false` (영역 편집) | 타이틀 "영역 편집하기" + X 버튼 |
| `true` (자동배치) | 백 버튼 + SpaceAI 아이콘 4종 |

전환: `opacity 400ms ease-in-out` (roomFrame과 동시 진행)

---

### 3-2. 영역 Zone 표시

미리 지정된 6개 영역이 프레임 위에 항상 노출.

| 영역 | 색상 | 위치 (280×188 기준) |
|---|---|---|
| 침실 | `rgba(0,179,45,0.4)` / `#00b32d` | x:183, y:0, w:97, h:149 |
| 거실 | `rgba(255,195,0,0.4)` / `#ffc300` | x:84, y:0, w:97, h:85 |
| 욕실 | `rgba(253,61,74,0.4)` / `#fd3d4a` | x:24, y:0, w:56, h:83 |
| 주방 | `rgba(255,123,40,0.4)` / `#ff7b28` | x:72, y:87, w:109, h:101 |
| 현관 | `rgba(0,121,250,0.4)` / `#0079fa` | x:0, y:86, w:70, h:80 |
| 다용도실 | `rgba(200,0,255,0.4)` / `#c800ff` | x:228, y:151, w:52, h:37 |

Zone 사라짐 (다른 zone 선택 시): `opacity: 0`, `transition: 150ms ease`

---

### 3-3. Pill Badge (영역 라벨)

**기본 상태**
```
display: inline-flex
min-height: 20px / max-height: 20px
padding: 0 8px
border-radius: 15px
background: white
icon + text color: #8c8c8c
```

**활성화 상태** (탭 시)
```
background: #141414  (backgroundInverse)
icon + text color: white
transition: background 150ms ease, opacity 200ms ease
```

**편집 모드** (수정하기 진입 시)
```
opacity: 0
pointer-events: none
transition: opacity 200ms ease
```

---

### 3-4. 수정하기 / 삭제하기 액션바

활성화된 Pill이 있을 때만 노출.

```
position: absolute; bottom: 82px
display: flex; gap: 40px; justify-content: center
아이콘: 24×24 white (filter: brightness(0) invert(1))
레이블: 12px / #8c8c8c / Pretendard Medium
```

**진입:** `activeArea !== null` 조건으로 React 조건부 렌더링 (애니메이션 없음)

---

### 3-5. 수정하기 → 편집 모드 전환

수정하기 버튼 탭 시:

| 요소 | 변화 |
|---|---|
| 선택된 zone | 파란 점선 스타일로 전환 (`rgba(0,161,255,0.20)` + `#00a1ff` 2px dashed) |
| 나머지 zone | `opacity: 0`, `transition: 150ms ease` |
| 모든 Pill | `opacity: 0`, `pointer-events: none` |
| 하단 CTA | `translateY(100%)` 슬라이드 다운, `transition: 300ms cubic-bezier(0.32,0.72,0,1)` |
| 가이드 스낵바 | `opacity: 1`, `transition: 200ms ease` |

---

### 3-6. 드래그 (영역 재지정)

편집 모드에서만 활성화. Pointer Events API 사용 (`setPointerCapture`).

**드래그 시작**
- 편집 중인 zone: `opacity: 0` (drag preview만 노출)

**드래그 preview 스타일**
```
fill: rgba(0,161,255,0.20)
stroke: #00a1ff / strokeWidth: 2 / strokeDasharray: 6 3
transition: opacity 150ms ease
```

**드래그 완료 (pointerup)**
- drag preview 제거
- zone 원래 스타일로 복귀
- `activeArea` 복원 → 액션바 + CTA 재노출
- `zoneOnlyView` 설정 → 해당 zone만 표시 유지

---

### 3-7. 하단 CTA 버튼

| 상태 | 레이블 | 동작 |
|---|---|---|
| 기본 | `이대로 사용하기` | 자동배치 바텀시트 오픈 |
| 활성화된 영역 있음 | `적용하기` | activeArea 초기화 → 기본 상태 복귀 |
| 드래그 중 | — | `translateY(100%)` 슬라이드 다운 |
| 첫 드래그 완료 후 | `적용하기` | 다시 슬라이드 업 |

**슬라이드 다운/업:**
```
transform: translateY(100%) ↔ translateY(0)
transition: 300ms cubic-bezier(0.32, 0.72, 0, 1)
```

---

### 3-8. 가이드 스낵바

편집 모드 진입 직후, 첫 드래그 전까지 노출.

```
position: absolute; bottom: 20px; left: 50% (수평 중앙)
background: rgba(255,255,255,0.12); backdrop-filter: blur(20px)
border-radius: 12px; padding: 8px 12px
font: 16px / white

노출 조건: editingArea && !editDragged && !areaDragPreview
transition: opacity 200ms ease
```

---

### 3-9. 자동배치 바텀시트

**등장 / 퇴장**
```
transform: translateY(100%) → translateY(0)   // 등장
transform: translateY(0) → translateY(100%)   // 퇴장

등장: transition 450ms cubic-bezier(0.32, 0.72, 0, 1)
퇴장: transition 300ms ease-in-out
```

**높이 변화** (배치안 선택 후 확장)
```
초기: 320px
배치안 카드 등장 후: 368px
transition: height 350ms cubic-bezier(0.32, 0.72, 0, 1)
```

**Grabber 드래그**
```
min: 320px / max: 706px
드래그 중: transition 없음 (즉각 반응)
손 뗀 후 snap: 320px 또는 368px (혹은 706px)
```

---

### 3-10. 자동배치 AI 시퀀스 타이밍

"모두 배치해줘." 탭 후 진행되는 타이머 시퀀스.

| 시점 | 동작 |
|---|---|
| +0ms | 유저 버블 등장 (`opacity 0→1`, `translateY(8px→0)`, 280ms) |
| +500ms | AI 응답 텍스트 등장 (동일한 fade+slide) |
| +700ms | 스피너 노출 |
| +2000ms | AI 텍스트 blink (opacity 0.3s) |
| +2320ms | "침대를 먼저 배치하고 있어요." + 방 이미지 오버레이 fade-in |
| +5000ms | blink |
| +5320ms | "탁자를 배치하고 있어요." |
| +8000ms | blink |
| +8320ms | "러그를 깔고 소품들을 배치하고 있어요." |
| +11000ms | blink |
| +11320ms | "침실 배치가 완료되었어요." + 스피너 off |
| +11720ms | 배치안 선택 카드 등장 + 바텀시트 368px로 확장 |

**방 이미지 fade-in:**
```css
animation: ap-room-fadein 300ms ease-in both
(from opacity:0 → opacity:1)
```

**배치안 선택 카드 등장:**
```
opacity: 0 → 1
translateY(16px → 0)
transition: 300ms ease / 300ms cubic-bezier(0.32,0.72,0,1)
```

---

### 3-11. 배치안 확정 후 시퀀스

배치안 선택 → 전송 버튼 탭 시.

| 시점 | 동작 |
|---|---|
| +0ms | 바텀시트 퇴장 (300ms ease-in-out) |
| +300ms | 스낵바 등장 (`opacity 0→1`, 300ms ease-out) |
| +3300ms | 스낵바 퇴장 (`opacity 1→0`, 200ms ease-out) |
| +3800ms | `/onboarding-done` 화면 전환 |

**3D 방 이동 (Room Down):**
```
top: calc(50% - 89px) → calc(50% + 1px)
transition: top 500ms ease-in-out
```

**스낵바:**
```
position: absolute; left: 16px; right: 16px; bottom: 20px
border-radius: 12px; background: #141414
transition: opacity 300ms/200ms ease-out
```

---

### 3-12. 3D 방 프레임 전환

영역 편집 → 자동배치 전환 시.

```
opacity: 1 → 0   (영역 편집 프레임 퇴장)
opacity: 0 → 1   (자동배치 방 프레임 등장)
transition: opacity 400ms ease-in-out
```

---

## 4. 공통 스낵바 스펙

```
padding: 13px 16px
border-radius: 8px (영역 삭제) / 12px (배치 완료)
background: #141414
font: 14px / Pretendard Regular / white
노출 시간: 2500ms (영역 삭제) / 3000ms (배치 완료)

등장: opacity 0→1 + translateY(100px→0), 300ms/450ms ease-spring
퇴장: opacity 1→0
```

---

## 5. 스피너 (자동배치 중)

방 프레임 중앙 40×40px.

```css
@keyframes defaultRoomSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
animation: defaultRoomSpin 1.2s linear infinite
transform-origin: 20px 20px
```

---

## 6. AI 스파클 아이콘

```css
@keyframes ap-spark-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50%       { transform: scale(0.62) rotate(-14deg); }
}
animation: ap-spark-pulse 1.5s ease-in-out infinite
두 번째 path: animation-delay 0.5s
```
