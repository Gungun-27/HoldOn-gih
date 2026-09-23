-- HoldOn: Supabase Schema (Phase P1)
-- Run this in the Supabase SQL Editor.
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Citizen',
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'officer')),
  trusted_contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Allow insert by owner or system/trigger (auth.uid() is null during auth trigger execution)
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.uid() IS NULL
);

-- Ensure GoTrue auth admin and postgres have necessary privileges
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- Auto-create profile on signup
-- Fully qualified, SECURITY DEFINER with SET search_path = public, and EXCEPTION safe.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), 'Citizen'),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('user', 'officer') THEN NEW.raw_user_meta_data->>'role'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.profiles.name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Guard against any unexpected failure aborting auth.users creation
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref              TEXT UNIQUE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  complainant_name TEXT,
  complainant_email TEXT NOT NULL,
  category         TEXT NOT NULL,
  incident_at      TIMESTAMPTZ,
  state            TEXT NOT NULL,
  district         TEXT,
  amount_lost      NUMERIC NOT NULL DEFAULT 0,
  description      TEXT NOT NULL,
  masked_excerpt   TEXT,
  analysis_summary JSONB,
  status           TEXT NOT NULL DEFAULT 'Submitted'
                     CHECK (status IN (
                       'Submitted',
                       'Under Verification',
                       'Verified',
                       'Forwarded to Cyber Cell',
                       'Closed'
                     )),
  report_hash      TEXT,
  canonical_json   TEXT,
  consent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_seed          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Citizens read only their own complaints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'complaints_select_own' AND tablename = 'complaints') THEN
    CREATE POLICY complaints_select_own ON complaints FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Officers read all complaints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'complaints_select_officer' AND tablename = 'complaints') THEN
    CREATE POLICY complaints_select_officer ON complaints FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'officer'
        )
      );
  END IF;
END $$;

-- Authenticated users can insert (service role bypasses RLS anyway)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'complaints_insert_auth' AND tablename = 'complaints') THEN
    CREATE POLICY complaints_insert_auth ON complaints FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Officers can update complaint status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'complaints_update_officer' AND tablename = 'complaints') THEN
    CREATE POLICY complaints_update_officer ON complaints FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'officer'
        )
      );
  END IF;
END $$;

-- Citizens can update their own complaints (e.g. for DPDP right to erasure / anonymisation)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'complaints_update_own' AND tablename = 'complaints') THEN
    CREATE POLICY complaints_update_own ON complaints FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Support anonymisation and right-to-erasure (FR-40)
ALTER TABLE complaints ALTER COLUMN description DROP NOT NULL;
ALTER TABLE complaints ALTER COLUMN complainant_email DROP NOT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;

-- Index for fast hash lookups (FR-18 verify endpoint)
CREATE INDEX IF NOT EXISTS idx_complaints_report_hash ON complaints (report_hash);

-- Index for ref lookups (tracking)
CREATE INDEX IF NOT EXISTS idx_complaints_ref ON complaints (ref);

-- Index for user's complaints
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints (user_id);

-- ============================================================
-- 3. COMPLAINT_EVENTS (append-only audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role    TEXT NOT NULL DEFAULT 'citizen',
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE complaint_events ENABLE ROW LEVEL SECURITY;

-- Citizens can read events on their own complaints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'events_select_own' AND tablename = 'complaint_events') THEN
    CREATE POLICY events_select_own ON complaint_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM complaints WHERE complaints.id = complaint_events.complaint_id
            AND complaints.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Officers can read all events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'events_select_officer' AND tablename = 'complaint_events') THEN
    CREATE POLICY events_select_officer ON complaint_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'officer'
        )
      );
  END IF;
END $$;

-- Insert via service role only (server-side)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'events_insert_auth' AND tablename = 'complaint_events') THEN
    CREATE POLICY events_insert_auth ON complaint_events FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_complaint_id ON complaint_events (complaint_id);

-- ============================================================
-- 4. GENERATE COMPLAINT REF (RPC)
-- ============================================================
-- Generates HLD-YYYY-NNNNNN with a sequence to avoid collisions
CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START 100001;

CREATE OR REPLACE FUNCTION public.generate_complaint_ref()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('complaint_ref_seq');
  RETURN 'HLD-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- 5. AGGREGATE VIEW FOR MAP (P2, included for completeness)
-- ============================================================
DROP VIEW IF EXISTS complaint_geo_agg CASCADE;
CREATE VIEW complaint_geo_agg AS
SELECT
  state,
  COUNT(*) AS complaint_count,
  COUNT(*) FILTER (WHERE is_seed = false) AS real_count
FROM complaints
GROUP BY state
HAVING COUNT(*) >= 3;

-- ============================================================
-- 6. ENABLE REALTIME on complaint_events for tracking updates
-- ============================================================
-- Note: Run this in Supabase Dashboard > Database > Replication
-- or use: ALTER PUBLICATION supabase_realtime ADD TABLE complaint_events;
-- This may require superuser; if it fails, enable via the Dashboard.
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaint_events;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add complaint_events to realtime publication. Enable it manually in the Supabase Dashboard.';
  END;
END $$;
