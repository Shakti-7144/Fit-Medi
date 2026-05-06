
DO $$ BEGIN
  CREATE TYPE public.appt_type AS ENUM ('video', 'in_person');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_type public.appt_type NOT NULL DEFAULT 'in_person';
