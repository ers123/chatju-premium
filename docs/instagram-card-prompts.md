# Instagram Share Card - Image Generation Prompts

## 용도
무료 프리뷰 결과를 인스타그램 스토리/피드에 공유할 수 있는 카드 이미지.
사용자가 결과 페이지에서 "공유하기" 버튼을 누르면 이 카드가 생성됨.

## 카드 구성 요소
1. 소명 로고 (상단)
2. 아이 띠 동물 아이콘 + 이름
3. 오행 분포 바 차트 (5개 바)
4. 일간 기질 한 줄 요약
5. QR코드 or URL (하단)

---

## Midjourney / DALL-E Prompt (카드 배경 템플릿용)

### 기본 템플릿 배경
```
Elegant minimalist Korean fortune-telling result card, 1080x1920 vertical format (Instagram Story),
soft cream/ivory background (#FDFCFA), forest green (#1A3D2E) and royal gold (#B8922D) accents,
subtle oriental cloud pattern watermark, clean modern serif typography spaces,
five horizontal bars placeholder for Five Elements chart,
zodiac animal icon circle at top center,
sophisticated but warm, NOT mystical or spooky,
modern luxury spa/wellness aesthetic like Sulwhasoo or Osulloc branding,
plenty of white space, no text (text will be overlaid programmatically)
```

### 오행별 색상 팔레트 (프로그래밍용)
```
목(Wood): #5A7A66 (forest green)
화(Fire): #A85544 (warm terracotta)
토(Earth): #B8922D (royal gold)
금(Metal): #8B9DAF (silver blue)
수(Water): #1A3D2E (deep navy green)
배경: #FDFCFA (warm ivory)
텍스트: #1A3D2E (dark green)
서브텍스트: #6B7280 (gray)
```

### 오행 바 차트 스타일
```
각 오행 바: 높이 8px, 라운드 코너, 배경 #F3F4F6
채워진 부분: 해당 오행 색상
레이블: 목 화 토 금 수 (한글, 11px)
값: 0~4 (8자 중 비율)
```

---

## 카드 텍스트 구성 (프로그래밍으로 오버레이)

### 상단
```
[소명 로고]     [동물띠 아이콘]
              {아이이름}의 기질 분석
```

### 중단
```
{일간 이미지} 기질

"{기질 한 줄 요약}"

예: "큰 강처럼 깊이 있고 포용력 있는 타입.
    겉은 잔잔해도 속은 늘 흐르고 있어요."
```

### 오행 차트
```
목 ████░░░░  2/8
화 ██░░░░░░  1/8
토 ██████░░  3/8  ← 가장 강함
금 ░░░░░░░░  0/8  ← 부족!
수 ████░░░░  2/8
```

### 하단
```
somyung.kr에서 상세 분석 보기
[QR코드]
```

---

## 일간별 한 줄 요약 텍스트

| 일간 | 이미지 | 한 줄 요약 |
|------|--------|-----------|
| 갑목 | 큰 나무 | 하늘을 향해 곧게 자라는 힘. 꺾이기보다 부러지는 당당한 아이. |
| 을목 | 넝쿨/풀 | 바람에 휘어져도 절대 뿌리째 뽑히지 않는 끈기의 아이. |
| 병화 | 태양 | 세상을 밝히는 에너지. 숨기지 못하는 솔직함이 매력. |
| 정화 | 촛불 | 은은하게 빛나는 내면의 불꽃. 섬세하고 따뜻한 마음. |
| 무토 | 큰 산 | 쉽게 흔들리지 않는 든든함. 느리지만 한번 시작하면 끝까지. |
| 기토 | 정원 | 모든 것을 품어 기르는 포근함. 실용적이고 배려 깊은 아이. |
| 경금 | 바위 | 단단한 의리와 결단력. 옳고 그름에 절대 타협하지 않아요. |
| 신금 | 보석 | 세공된 금속처럼 정밀한 감각. 자존심 높고 완벽을 추구해요. |
| 임수 | 큰 강 | 깊이 있는 마음과 넓은 포용력. 겉은 잔잔해도 속은 늘 흐르고 있어요. |
| 계수 | 이슬비 | 스며들듯 사람의 마음을 적시는 힘. 직관적이고 섬세한 아이. |

---

## 프론트엔드 구현 방향

### Option A: HTML Canvas로 클라이언트 생성
- `html2canvas` 라이브러리 사용
- 결과 페이지에서 카드 HTML을 렌더링 → canvas → PNG 다운로드
- 장점: 서버 부하 없음, 즉시 생성
- 단점: 폰트/렌더링 일관성

### Option B: 서버 사이드 생성 (Puppeteer/Sharp)
- 서버에서 HTML → 이미지 변환
- 장점: 일관된 렌더링
- 단점: 서버 리소스, Lambda에서 Puppeteer 무거움

### 추천: Option A (html2canvas)
- Cloudflare Pages에서 서빙되는 정적 사이트이므로 클라이언트 생성이 적합
- `navigator.share()` API로 모바일에서 바로 인스타 공유 가능
