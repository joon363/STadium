# Supabase Setup Guide & SQL Scripts - 2026 STadium

This document contains the step-by-step instructions and complete SQL scripts required to set up **Supabase** for the 2026 STadium application and its admin dashboard (`/admin`).

---

## 1. Supabase Project Setup

1. Sign in to [Supabase Console](https://supabase.com) and create a new project named **`stadium-2026`**.
2. Once the database is ready, navigate to **Project Settings → API**.
3. Copy the following keys:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **API Key (anon / public)**: `eyJ...`
4. Configure these environment variables in Vercel (or in local `.env.local` file):
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

---

## 2. SQL DDL & Seed Scripts

Go to **Supabase Console → SQL Editor**, create a new query, paste the following SQL code, and click **RUN**:

```sql
-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Table: matches (Sports Schedule & Scores)
CREATE TABLE IF NOT EXISTS public.matches (
    id VARCHAR(50) PRIMARY KEY,
    sport_key VARCHAR(50) NOT NULL,
    sport_name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    team1 VARCHAR(50) NOT NULL,
    team2 VARCHAR(50) NOT NULL,
    start_hour INT NOT NULL,
    start_minute INT NOT NULL,
    end_hour INT NOT NULL,
    end_minute INT NOT NULL,
    venue VARCHAR(100) NOT NULL,
    round VARCHAR(100) NOT NULL,
    score1_final INT DEFAULT 0,
    score2_final INT DEFAULT 0,
    winning_team_final VARCHAR(50),
    subtitle VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: stage_performances (Gym Stage Timetable)
CREATE TABLE IF NOT EXISTS public.stage_performances (
    id SERIAL PRIMARY KEY,
    school VARCHAR(50) NOT NULL,
    club_name VARCHAR(100) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    start_hour INT NOT NULL,
    start_minute INT NOT NULL,
    end_hour INT NOT NULL,
    end_minute INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: admin_settings (Admin Password & System Config)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 2. Row Level Security (RLS) Policies
-- ==========================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all users
CREATE POLICY "Allow public read on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on matches" ON public.matches FOR ALL USING (true);

CREATE POLICY "Allow public read on stage_performances" ON public.stage_performances FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on stage_performances" ON public.stage_performances FOR ALL USING (true);

CREATE POLICY "Allow public read on admin_settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on admin_settings" ON public.admin_settings FOR ALL USING (true);


-- ==========================================
-- 3. Initial Seed Data
-- ==========================================

-- Seed Matches (Soccer, Baseball, LoL, Badminton, Basketball)
INSERT INTO public.matches (id, sport_key, sport_name, icon, team1, team2, start_hour, start_minute, end_hour, end_minute, venue, round, score1_final, score2_final, winning_team_final, subtitle)
VALUES
-- Soccer
('soc-1', 'soccer', '축구', '⚽', 'GIST', 'UNIST', 10, 0, 11, 30, '대운동장', '8강 1경기', 2, 1, 'GIST', NULL),
('soc-2', 'soccer', '축구', '⚽', 'KAIST', 'DGIST', 12, 0, 13, 30, '대운동장', '준결승 1경기', 3, 1, 'KAIST', NULL),
('soc-3', 'soccer', '축구', '⚽', 'POSTECH', 'KAIST', 17, 0, 18, 30, '대운동장', '준결승 2경기 (라이벌전)', 2, 1, 'POSTECH', NULL),
('soc-4', 'soccer', '축구', '⚽', 'POSTECH', 'GIST', 19, 0, 20, 30, '대운동장', '결승전', 3, 2, 'POSTECH', NULL),

-- Baseball
('bb-1', 'baseball', '야구', '⚾', 'DGIST', 'GIST', 9, 30, 12, 0, '곡강 야구장', '예선 1경기', 4, 2, 'DGIST', NULL),
('bb-2', 'baseball', '야구', '⚾', 'POSTECH', 'KAIST', 16, 30, 18, 30, '포항야구장', '본선 메인 매치', 5, 3, 'POSTECH', NULL),
('bb-3', 'baseball', '야구', '⚾', 'UNIST', 'KENTECH', 19, 0, 21, 0, '포항야구장', '순위 결정전', 2, 1, 'UNIST', NULL),

-- LoL
('lol-1', 'lol', 'LoL', '🎮', 'POSTECH', 'GIST', 11, 0, 13, 0, '콜로세움', '8강 BO3', 2, 0, 'POSTECH', NULL),
('lol-2', 'lol', 'LoL', '🎮', 'KAIST', 'UNIST', 17, 15, 18, 45, '콜로세움', '4강 BO3', 2, 1, 'KAIST', NULL),
('lol-3', 'lol', 'LoL', '🎮', 'POSTECH', 'KAIST', 19, 15, 21, 45, '콜로세움', '결승 BO5', 3, 1, 'POSTECH', NULL),

-- Badminton
('bad-1', 'badminton', '배드민턴', '🏸', 'GIST', 'UNIST', 11, 0, 13, 0, '체육관 B코트', '배드민턴 예선 1경기', 3, 1, 'GIST', NULL),
('bad-2', 'badminton', '배드민턴', '🏸', 'POSTECH', 'KAIST', 17, 0, 18, 30, '체육관 B코트', '배드민턴 라이벌전', 3, 2, 'POSTECH', NULL),

-- Basketball
('bk-1', 'basketball', '농구', '🏀', 'POSTECH', 'KAIST', 13, 30, 15, 30, '체육관 A코트', '농구 본선 1경기', 68, 62, 'POSTECH', NULL),
('bk-2', 'basketball', '농구', '🏀', 'KAIST', 'UNIST', 17, 0, 19, 0, '체육관 A코트', '농구 준결승전', 58, 52, 'KAIST', NULL),
('bk-3', 'basketball', '농구', '🏀', 'DGIST', 'KENTECH', 19, 30, 21, 0, '체육관 A코트', '농구 순위결정전', 55, 49, 'DGIST', NULL)
ON CONFLICT (id) DO UPDATE SET
    team1 = EXCLUDED.team1,
    team2 = EXCLUDED.team2,
    score1_final = EXCLUDED.score1_final,
    score2_final = EXCLUDED.score2_final,
    winning_team_final = EXCLUDED.winning_team_final;

-- Seed Stage Performances
INSERT INTO public.stage_performances (id, school, club_name, genre, song_title, start_hour, start_minute, end_hour, end_minute)
VALUES
(1, 'GIST', 'PULSE (댄스동아리)', 'K-POP & 힙합 댄스', 'Supernova - aespa (Cover)', 14, 0, 15, 0),
(2, 'UNIST', 'MELODY (밴드)', '모던 록', '한 페이지가 될 수 있게 - DAY6', 15, 0, 16, 0),
(3, 'DGIST', 'BEAT (힙합)', '스트릿 힙합', '자작곡 & 사이퍼 쇼케이스', 16, 0, 17, 15),
(4, 'POSTECH', '스틸러 (Steeler)', '락 밴드', '사건의 지평선 - 윤하 (Cover)', 17, 15, 18, 0),
(5, 'KAIST', 'CHORUS (보컬동아리)', '아카펠라 & 발라드', 'STadium 축하합창 메들리', 18, 0, 19, 0),
(6, 'POSTECH', 'STadium 초청가수 특별공연', '메인 축하공연', '2026 STadium 피날레 콘서트', 19, 0, 21, 0)
ON CONFLICT (id) DO UPDATE SET
    club_name = EXCLUDED.club_name,
    song_title = EXCLUDED.song_title;

-- Seed Admin Password (Default: stadium2026!)
INSERT INTO public.admin_settings (key, value)
VALUES ('admin_password', 'stadium2026!')
ON CONFLICT (key) DO NOTHING;
```

---

## 3. Vercel Deployment

1. Run `npx vercel` in the terminal inside `c:\Users\joon3\NPMProjects\stu\STadium`.
2. Follow the prompt to log in and select project settings.
3. In Vercel Project Settings → Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Access `/admin` on your Vercel deployment URL to manage live scores, timetable, and admin password!
