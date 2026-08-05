# STadium (카포전 / ST Match Web Platform)

STadium은 POSTECH과 KAIST의 교류전(카포전) 당일 방문객과 참관객을 위해 제작된 **모바일 퍼스트 라이브 스코어 및 카포전 안내 웹 애플리케이션**입니다. 실시간 경기 현황, 공연 정보, 부스 및 푸드트럭 안내, GPS 기반 2D 캠퍼스 맵 길찾기 기능 등을 제공합니다.

---

## 🛠 Tech Stack (기술 스택)

### Frontend
- **Framework & Language**: React 18, TypeScript 5, Vite 6
- **Styling**: Tailwind CSS v3, PostCSS, Autoprefixer
- **Typography & Icons**: Pretendard Font, Lucide React Icons
- **Routing**: React Router v6 (`react-router-dom`)
- **State Management**: React Context API (`SchoolContext`), Custom React Hooks (`useRealtimeSchedule`)

### Backend & Infrastructure
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL Database, Realtime Subscriptions)
- **Deployment & Hosting**: Vercel Platform (`vercel.json`)
- **API Client**: `@supabase/supabase-js`

---

## 🏛 System Architecture & Design (시스템 아키텍처)

```
                       ┌──────────────────────────────────────────┐
                       │               Vercel Edge                │
                       └────────────────────┬─────────────────────┘
                                            │
                                  ┌─────────┴─────────┐
                                  │   Vite + React    │
                                  │ (Single Page App) │
                                  └─────────┬─────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
 ┌─────────▼─────────┐            ┌─────────▼─────────┐            ┌─────────▼─────────┐
 │   Router / Pages  │            │ Realtime Hook /   │            │   Config / State  │
 │ (Home, Map, Admin)│            │  Supabase Client  │            │ (stadiumConfig,   │
 └─────────┬─────────┘            └─────────┬─────────┘            │  SchoolContext)   │
           │                                │                      └───────────────────┘
 ┌─────────▼─────────┐                      │
 │    Components     │                      │
 │ (Header, MapView, │                      │
 │  SportsGridCard)  │                      │
 └───────────────────┘                      │
                                            ▼
                                ┌──────────────────────┐
                                │   Supabase Cloud     │
                                │ (Postgres + Realtime)│
                                └──────────────────────┘
```

### Architecture Highlights

1. **Config-Driven & Fallback Resilience Architecture**
   - 기본 경기 데이터, 학교별 시그니처 컬러, 퍼포먼스 일정, 부스/푸드트럭 정보는 `stadiumConfig.ts`에 하드코딩 및 셋업되어 인터넷 연결 상태와 상관없이 안정적인 초기 로딩을 보장합니다.
   - 운영진이 관리자 페이지(`Admin.tsx`)에서 경기 진행 상황, 스코어, 딜레이를 업데이트하면 Supabase Realtime Channel(`schedule_overrides`)을 통해 관람객 화면에 수 초 내로 동기화됩니다.

2. **Mobile-First Responsive Container**
   - 모바일 관람객의 최적화된 사용자 경험을 위해 `MobileContainer` 래퍼 레이아웃을 제공하며, 데스크톱 브라우저 접속 시에도 모바일 프레임 뷰로 쾌적하게 렌더링됩니다.

3. **GPS-Assisted Custom 2D Campus Map (`CampusMapView.tsx`)**
   - 포스텍 캠퍼스 2D 지도 이미지 상의 위경도 좌표 역산 매핑 로직을 탑재하여, 유저의 실제 GPS 위치를 커스텀 포스텍 지적도 위에 오버레이합니다.
   - 출발지/목적지 선택 길찾기, 휴식 공간, 취식 가능 공간, 경기/행사 장소 핀 필터링 기능을 내장하고 있습니다.

4. **Realtime Admin Dashboard (`Admin.tsx`)**
   - 경기 현황(축구, 야구, 농구, 배드민턴, 롤, 이스포츠 등) 실시간 점수 수정 및 경기 상태 업데이트.
   - 상단 공지사항 배너 등록/수정/삭제.
   - 동아리 공연 진행 정보 동기화.

---

## 📁 Directory Structure (프로젝트 구조)

```
STadium/
├── public/                # 정적 에셋 (학교 로고, 맵 이미지, 동아리 에셋 등)
├── pretendard/            # Pretendard 폰트 파일
├── src/
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   │   ├── CampusMapView.tsx       # 2D GPS 지원 커스텀 지적도
│   │   ├── Header.tsx              # 상단 네비게이션 및 드로어 메뉴
│   │   ├── LeaderboardSection.tsx  # 종합 점수 스코어보드
│   │   ├── MobileContainer.tsx     # 모바일 전용 뷰 포트 레이아웃 래퍼
│   │   └── SportsGridCard.tsx      # 실시간 경기 카드 컴포넌트
│   ├── config/            # 경기, 공연, 장소, 부스 등 프로젝트 데이터 설정
│   │   └── stadiumConfig.ts
│   ├── context/           # 애플리케이션 상태 (학교 선택 등)
│   │   └── SchoolContext.tsx
│   ├── hooks/             # 커스텀 훅 (Supabase Realtime 동기화)
│   │   └── useRealtimeSchedule.ts
│   ├── lib/               # 외부 라이브러리 및 API 싱글톤
│   │   └── supabase.ts             # Supabase 연동 클라이언트
│   ├── pages/             # 주요 라우트 페이지
│   │   ├── Home.tsx                # 대시보드 메인 화면
│   │   ├── SportDetail.tsx         # 종목별 상세 경기 일정
│   │   ├── StageDetail.tsx         # 무대 공연 타임테이블
│   │   ├── CampusMap.tsx           # 캠퍼스 맵 페이지
│   │   ├── BoothGuide.tsx          # 동아리/행사 부스 안내
│   │   ├── FoodTruckGuide.tsx      # 푸드트럭 위치 및 메뉴 안내
│   │   ├── SponsorGuide.tsx        # 스폰서 안내
│   │   ├── Contact.tsx             # 담당자 연락처 및 채널 안내
│   │   └── Admin.tsx               # 운영진 실시간 관리자 패널
│   ├── App.tsx            # 라우터 구성 및 메인 앱 엔트리
│   ├── main.tsx           # React DOM 렌더링
│   └── index.css          # Tailwind CSS 커스텀 스타일
├── index.html             # HTML 엔트리 포인트
├── tailwind.config.js     # Tailwind 설정
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 설정
└── vercel.json            # Vercel 배포 설정
```

---

## 🚀 Getting Started (시작하기)

### 1. Repository Clone & Dependency Install

```bash
git clone https://github.com/joon363/STadium.git
cd STadium
npm install
```

### 2. Environment Variables Setup (`.env.local`)

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 Supabase 접속 정보를 작성합니다.

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Development Server Run

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 4. Build & Preview

```bash
# TypeScript 검사 및 Production 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

---

## 📄 License & Contact

- **Maintained for**: POSTECH & KAIST Science & Technology Exchange Festival
- **Repository**: [joon363/STadium](https://github.com/joon363/STadium)
