# 🐟 Project Anchovy (멸치 탈출 프로젝트)

> **"먹는 것까지가 운동이다"**  
> 53kg → 60kg, 마른 체질(Hardgainer) 전용 벌크업 매니저

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목표** | 체중 53kg → 60kg 달성 |
| **타겟 유저** | 173cm/53kg 외배엽 직장인 (하드게이너) |
| **핵심 기능** | 3분할 운동 기록 + 식단 관리 + 진행률 시각화 |
| **특수 기능** | 유당불내증 경고, 간식 푸시 알림 |

### 🎯 핵심 KPI

- ✅ 사용자 체중: 53kg → **60kg 달성**
- ✅ 주간 운동 달성률: 80% 이상 (주 5회 중 4회)
- ✅ 하루 식사 횟수: 평균 **4끼 이상**

---

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 확인
open http://localhost:3000
```

---

## 🔥 Firebase 설정 (필수)

데이터를 저장하려면 Firebase 프로젝트를 연결해야 합니다.

### 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `anchovy-app` (원하는 이름)
4. Google Analytics는 선택사항

### 2단계: 웹 앱 등록

1. 프로젝트 설정 > 일반 > "앱 추가" > 웹 (`</>` 아이콘)
2. 앱 닉네임: `anchovy-web`
3. Firebase SDK 설정 정보 복사

### 3단계: 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4단계: Firestore & Authentication 활성화

**Firestore Database:**
1. Firebase Console > Firestore Database > 데이터베이스 만들기
2. "테스트 모드에서 시작" 선택 (개발용)
3. 위치: `asia-northeast3` (서울)

**Authentication:**
1. Firebase Console > Authentication > 시작하기
2. "익명" 로그인 활성화

### 5단계: 서버 재시작

```bash
npm run dev
```

이제 식단/운동 완료 체크가 Firebase에 저장됩니다! 🎉

---

## 📁 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # 전역 스타일 (애니메이션, 모바일 최적화)
│   ├── layout.tsx                # 루트 레이아웃 (PWA, Safe Area)
│   └── page.tsx                  # 메인 대시보드 페이지
│
├── components/                   # 재사용 컴포넌트
│   ├── dashboard/                # 대시보드 전용 컴포넌트
│   │   ├── ProgressCard.tsx      # 체중 진행률 카드
│   │   ├── WorkoutCard.tsx       # 오늘의 운동 카드 (요일별 자동 로딩)
│   │   ├── MealPlanCard.tsx      # 오늘의 식단 카드 (요일별 추천)
│   │   └── QuickActions.tsx      # 하단 고정 액션 버튼
│   └── ui/                       # 공통 UI 컴포넌트
│       └── ProgressBar.tsx       # 프로그레스 바
│
├── lib/                          # 유틸리티 & 상수
│   ├── constants.ts              # 요일별 운동/식단 데이터, 목표 설정
│   └── utils.ts                  # D-Day, 칼로리 계산, 햅틱 피드백
│
└── types/                        # TypeScript 타입 정의
    └── index.ts                  # 모든 인터페이스 & 타입
```

---

## 🎨 디자인 시스템

### 컬러 팔레트

| 용도 | 컬러 | HEX |
|------|------|-----|
| 배경 | Dark Navy | `#0a0a0f` |
| 카드 배경 | Deep Blue | `#1a1a2e` |
| Primary | Deep Green | `#2E7D32` |
| Accent | Neon Lime | `#C6FF00` |

### 폰트

- **Pretendard Variable** - 한글 최적화 가변 폰트

### 애니메이션

- `animate-fade-in` - 페이드 인 등장
- `animate-slide-up` - 아래에서 위로 슬라이드
- `animate-shimmer` - 반짝임 효과
- `animate-pulse-glow` - 네온 글로우 펄스

---

## ⚙️ 주요 기능

### ✅ 구현 완료

| 기능 | 설명 |
|------|------|
| **체중 진행률** | 시작 → 목표 체중까지 Progress Bar로 시각화 |
| **D-Day 카운터** | 벌크업 시작일로부터 경과일 표시 |
| **요일별 운동 루틴** | 월~일 상세 운동 종목 자동 로딩 (세트/횟수/팁 포함) |
| **요일별 식단 추천** | 요일마다 다른 식단 메뉴 + 칼로리 자동 계산 |
| **식단 5끼 점수제** | 끼니 수에 따른 점수 (0~5) + 햅틱 피드백 |
| **점진적 과부하 UI** | 지난 기록 표시 + "+2.5kg 도전" 버튼 |
| **운동 방법 영상** | 번핏(Burnfit) 라이브러리 연동 - 자세/영상 확인 |
| **모바일 최적화** | iOS Safe Area, 터치 피드백, 하단 고정 버튼 |
| **반응형 다크 모드** | 헬스장 환경을 고려한 다크 테마 |

### 🔜 개발 예정

| 기능 | 우선순위 |
|------|----------|
| Supabase DB 연동 | ⭐⭐⭐ |
| 눈바디 사진 갤러리 | ⭐⭐⭐ |
| 운동 기록 상세 입력 | ⭐⭐⭐ |
| 유당불내증 경고 팝업 | ⭐⭐ |
| 세트 간 휴식 타이머 | ⭐⭐ |
| 주간 리포트 & 그래프 | ⭐ |
| 간식 푸시 알림 (오후 3시) | ⭐ |

---

## 🏋️ 트레이너 피드백 반영 내역

> AI 트레이너의 실전 피드백을 반영하여 앱을 개선했습니다.

### 1. 점진적 과부하 UI ✅
- **문제:** 지난주에 몇 kg 들었는지 바로 확인 불가
- **해결:** 운동 항목 클릭 시 "지난 기록: 40kg x 10회" 표시
- **보너스:** "+2.5kg 도전" 메시지 + Auto-fill 버튼

### 2. 식단 점수제 ✅
- **문제:** Bad/Good/Perfect는 주관적이고 스트레스 유발
- **해결:** 0~5 끼니 점수제로 변경
- **보너스:** 점수별 이모지 & 색상 + "근성장 +1" 메시지

### 3. 눈바디 사진 기록 🔜
- **문제:** 체중(숫자)만으로는 변화 파악 어려움
- **해결:** `body_photos` 테이블 추가, 주간 갤러리 기능 예정

---

## 🗄️ 데이터베이스 스키마 (Supabase PostgreSQL)

> 🏋️ 트레이너 피드백 반영: 식단 점수제, 눈바디 사진, PR 기록

```sql
-- 1. 사용자 프로필
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  height FLOAT DEFAULT 173.0,
  current_weight FLOAT DEFAULT 53.0,
  target_weight FLOAT DEFAULT 60.0,
  lactose_intolerance BOOLEAN DEFAULT TRUE,
  start_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 일일 기록 (식단 점수제 + 눈바디 사진)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight_measured FLOAT,
  diet_score INT DEFAULT 0 CHECK (diet_score >= 0 AND diet_score <= 5), -- 0~5 끼니 점수
  workout_part TEXT CHECK (workout_part IN ('Push', 'Pull', 'Legs', 'Rest')),
  body_photo_url TEXT, -- 눈바디 사진 URL
  condition_note TEXT, -- 컨디션 메모 ("야근으로 피곤" 등)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 운동 세부 기록 (PR 달성 여부 추가)
CREATE TABLE workout_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_number INT NOT NULL,
  weight FLOAT NOT NULL,
  reps INT NOT NULL,
  is_pr BOOLEAN DEFAULT FALSE, -- 🏆 Personal Record 달성 시 True
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 눈바디 사진 갤러리 (주간 기록용)
CREATE TABLE body_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  photo_url TEXT NOT NULL,
  weight FLOAT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_workout_records_log ON workout_records(log_id);
CREATE INDEX idx_body_photos_user ON body_photos(user_id, date);
```

---

## 🏋️ 운동 루틴

| 요일 | 파트 | 주요 운동 |
|------|------|----------|
| 월 | Push | 벤치 프레스, 밀리터리 프레스 |
| 화 | Pull | 랫 풀다운, 바벨 로우 |
| 수 | Legs | 스쿼트, 레그 프레스 |
| 목 | Push | 인클라인 프레스, 사이드 레터럴 |
| 금 | Pull | 시티드 로우, 바벨 컬 |
| 토/일 | Rest | 휴식 & 회복 |

---

## 🎬 운동 라이브러리 연동

각 운동 항목을 클릭하면 **"운동 방법 보기"** 버튼이 표시됩니다.  
[번핏(Burnfit)](https://burnfit.io) 라이브러리와 연동하여 전문적인 운동 자세와 영상을 확인할 수 있습니다.

| 연동 서비스 | 설명 |
|-------------|------|
| **Burnfit** | Forbes 선정 4년 연속 최고의 운동 데이터 앱 |
| **제공 정보** | 운동 자세 설명, 영상 가이드, 난이도 |

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, CSS Variables |
| **Font** | Pretendard Variable (한글) |
| **Backend** | Supabase (예정) |
| **Deploy** | Vercel (예정) |

---

## 📱 스크린샷

> *개발 진행 중 - 추후 추가 예정*

---

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

---

<p align="center">
  <strong>🐟 → 🐠 → 🦈</strong><br>
  <em>멸치에서 상어로, 한 끼씩 성장하는 중</em>
</p>
