-- ============================================
-- สร้างตาราง workout_progress สำหรับ Supabase
-- คัดลอกโค้ดทั้งหมดนี้ไปรันใน SQL Editor
-- ============================================

-- 1. สร้างตาราง
CREATE TABLE IF NOT EXISTS workout_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 0,
  reps TEXT NOT NULL DEFAULT '',
  body_weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
  workout_date DATE NOT NULL,
  week_start_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. สร้าง Indexes
CREATE INDEX IF NOT EXISTS idx_workout_progress_user_id ON workout_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_workout_date ON workout_progress(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_progress_week_start_date ON workout_progress(week_start_date);
CREATE INDEX IF NOT EXISTS idx_workout_progress_user_week ON workout_progress(user_id, week_start_date);

-- 3. เปิดใช้งาน RLS
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;

-- 4. ลบ policies เก่าถ้ามี (เพื่อป้องกัน error)
DROP POLICY IF EXISTS "Users can view their own workout progress" ON workout_progress;
DROP POLICY IF EXISTS "Users can insert their own workout progress" ON workout_progress;
DROP POLICY IF EXISTS "Users can update their own workout progress" ON workout_progress;
DROP POLICY IF EXISTS "Users can delete their own workout progress" ON workout_progress;

-- 5. สร้าง RLS Policies ใหม่
CREATE POLICY "Users can view their own workout progress"
  ON workout_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout progress"
  ON workout_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout progress"
  ON workout_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout progress"
  ON workout_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 6. สร้าง Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. ลบ trigger เก่าถ้ามี
DROP TRIGGER IF EXISTS update_workout_progress_updated_at ON workout_progress;

-- 8. สร้าง Trigger ใหม่
CREATE TRIGGER update_workout_progress_updated_at
  BEFORE UPDATE ON workout_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

