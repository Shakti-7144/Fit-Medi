-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  age int,
  gender text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles select own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.fitness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  steps int DEFAULT 0,
  calories_burned numeric DEFAULT 0,
  workout_type text,
  workout_duration int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fitness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fitness select own" ON public.fitness_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fitness insert own" ON public.fitness_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fitness update own" ON public.fitness_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fitness delete own" ON public.fitness_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_name text NOT NULL,
  meal_description text,
  ai_nutrition jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal select own" ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meal insert own" ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal update own" ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meal delete own" ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  ai_summary text,
  extracted_details jsonb,
  upload_date timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec select own" ON public.medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec insert own" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec update own" ON public.medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rec delete own" ON public.medical_records FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.symptom_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms text NOT NULL,
  ai_analysis text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.symptom_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sym select own" ON public.symptom_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sym insert own" ON public.symptom_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sym delete own" ON public.symptom_analyses FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);

CREATE POLICY "med files select own" ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "med files insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "med files delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  specialty text NOT NULL DEFAULT '',
  bio text,
  qualifications text,
  years_experience integer DEFAULT 0,
  location text,
  consultation_fee numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctor_profiles viewable by authenticated" ON public.doctor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "doctor_profiles insert own" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "doctor_profiles update own" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "doctor_profiles delete own" ON public.doctor_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability viewable by authenticated" ON public.doctor_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "availability insert own" ON public.doctor_availability FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "availability update own" ON public.doctor_availability FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "availability delete own" ON public.doctor_availability FOR DELETE TO authenticated USING (auth.uid() = doctor_id);

CREATE TYPE public.appt_status AS ENUM ('pending', 'confirmed', 'declined', 'completed', 'cancelled');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  reason text,
  status public.appt_status NOT NULL DEFAULT 'pending',
  doctor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments viewable by participants" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "appointments insert by patient" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "appointments update by participants" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "appointments delete by participants" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER doctor_profiles_touch BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER appointments_touch BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Avatars publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE OR REPLACE VIEW public.doctors_directory
WITH (security_invoker = true) AS
SELECT dp.user_id, dp.specialty, dp.bio, dp.qualifications, dp.years_experience, dp.location, dp.consultation_fee, p.name, p.avatar_url
FROM public.doctor_profiles dp
LEFT JOIN public.profiles p ON p.id = dp.user_id;