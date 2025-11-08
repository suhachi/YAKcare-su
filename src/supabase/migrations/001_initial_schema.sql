-- 약챙겨먹어요 초기 데이터베이스 스키마
-- Supabase 프로젝트의 SQL Editor에서 실행하세요

-- ===== 1. Medications 테이블 =====
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PRESCRIPTION', 'SUPPLEMENT', 'CHRONIC')),
  chronic_type TEXT CHECK (chronic_type IN ('HYPERTENSION', 'DIABETES', 'HYPERLIPIDEMIA', 'OTHER')),
  duration_days INTEGER,
  is_continuous BOOLEAN NOT NULL DEFAULT false,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  times JSONB NOT NULL DEFAULT '[]'::jsonb,
  intake_context TEXT CHECK (intake_context IN ('PLAIN', 'PREMEAL', 'POSTMEAL', 'BEDTIME')),
  source TEXT NOT NULL CHECK (source IN ('qr', 'ocr', 'manual')),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
CREATE INDEX IF NOT EXISTS idx_medications_created_at ON medications(created_at DESC);

-- ===== 2. Doses 테이블 =====
CREATE TABLE IF NOT EXISTS doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  med_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  med_category TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  slot_bucket TEXT NOT NULL CHECK (slot_bucket IN ('MORNING', 'NOON', 'EVENING', 'BEDTIME', 'OTHER')),
  intake_context TEXT CHECK (intake_context IN ('PLAIN', 'PREMEAL', 'POSTMEAL', 'BEDTIME')),
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'PENDING', 'SNOOZED', 'DONE', 'MISSED')),
  retries INTEGER NOT NULL DEFAULT 0,
  has_pre_alert BOOLEAN NOT NULL DEFAULT false,
  has_confirm_alert BOOLEAN NOT NULL DEFAULT false,
  next_alert_at TIMESTAMPTZ,
  card_key TEXT NOT NULL,
  card_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_doses_user_id ON doses(user_id);
CREATE INDEX IF NOT EXISTS idx_doses_med_id ON doses(med_id);
CREATE INDEX IF NOT EXISTS idx_doses_scheduled_at ON doses(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_doses_status ON doses(status);
CREATE INDEX IF NOT EXISTS idx_doses_card_key ON doses(card_key);
CREATE INDEX IF NOT EXISTS idx_doses_user_scheduled ON doses(user_id, scheduled_at);

-- ===== 3. Care Links 테이블 =====
CREATE TABLE IF NOT EXISTS care_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'REVOKED')),
  relation TEXT NOT NULL CHECK (relation IN ('PARENT', 'CHILD', 'SPOUSE', 'GUARDIAN', 'OTHER')),
  nickname TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_care_links_caregiver_id ON care_links(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_care_links_patient_id ON care_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_links_invite_code ON care_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_care_links_status ON care_links(status);

-- ===== 4. Health Records 테이블 =====
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BP', 'BG')),
  systolic INTEGER,
  diastolic INTEGER,
  pulse INTEGER,
  glucose INTEGER,
  measurement_type TEXT CHECK (measurement_type IN ('FASTING', 'POST_2H')),
  tag TEXT NOT NULL CHECK (tag IN ('MORNING', 'NOON', 'EVENING', 'BEDTIME', 'OTHER')),
  time TIMESTAMPTZ NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
CREATE INDEX IF NOT EXISTS idx_health_records_time ON health_records(time DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_user_time ON health_records(user_id, time DESC);

-- ===== 5. RLS (Row Level Security) 정책 =====

-- Medications RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own medications"
  ON medications FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own medications"
  ON medications FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own medications"
  ON medications FOR DELETE
  USING (auth.uid()::text = user_id);

-- Doses RLS
ALTER TABLE doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doses"
  ON doses FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own doses"
  ON doses FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own doses"
  ON doses FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own doses"
  ON doses FOR DELETE
  USING (auth.uid()::text = user_id);

-- Care Links RLS
ALTER TABLE care_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links they are part of"
  ON care_links FOR SELECT
  USING (auth.uid()::text = caregiver_id OR auth.uid()::text = patient_id);

CREATE POLICY "Caregivers can create links"
  ON care_links FOR INSERT
  WITH CHECK (auth.uid()::text = caregiver_id);

CREATE POLICY "Users can update links they are part of"
  ON care_links FOR UPDATE
  USING (auth.uid()::text = caregiver_id OR auth.uid()::text = patient_id);

CREATE POLICY "Users can delete links they are part of"
  ON care_links FOR DELETE
  USING (auth.uid()::text = caregiver_id OR auth.uid()::text = patient_id);

-- Health Records RLS
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health records"
  ON health_records FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own health records"
  ON health_records FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own health records"
  ON health_records FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own health records"
  ON health_records FOR DELETE
  USING (auth.uid()::text = user_id);

-- ===== 6. 트리거: updated_at 자동 업데이트 =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doses_updated_at
  BEFORE UPDATE ON doses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_links_updated_at
  BEFORE UPDATE ON care_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== 완료 =====
-- 스키마 생성이 완료되었습니다.
-- 이제 앱에서 Supabase를 사용할 수 있습니다.
