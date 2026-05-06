
-- Blocked dates
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, blocked_date)
);
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked viewable by authenticated" ON public.blocked_dates FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocked insert own" ON public.blocked_dates FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "blocked delete own" ON public.blocked_dates FOR DELETE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "blocked update own" ON public.blocked_dates FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);

-- Helper: does doctor have access to this patient?
CREATE OR REPLACE FUNCTION public.doctor_has_patient_access(_doctor UUID, _patient UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_id = _doctor AND patient_id = _patient
      AND status IN ('confirmed','completed')
  );
$$;

-- Allow doctors to view patient symptoms and records
CREATE POLICY "doctor view patient symptoms"
  ON public.symptom_analyses FOR SELECT TO authenticated
  USING (public.doctor_has_patient_access(auth.uid(), user_id));

CREATE POLICY "doctor view patient records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (public.doctor_has_patient_access(auth.uid(), user_id));

CREATE POLICY "doctor view patient profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.doctor_has_patient_access(auth.uid(), id));
