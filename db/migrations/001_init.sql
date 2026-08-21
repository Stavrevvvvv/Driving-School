-- Schema: roles, profiles, teacher_students, triggers, RLS, helpers

-- Create enum for roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- Helper schema for security-definer functions

CREATE SCHEMA IF NOT EXISTS helpers;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'STUDENT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- teacher_students join table
CREATE TABLE IF NOT EXISTS public.teacher_students (
  teacher_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (teacher_id, student_id),
  CONSTRAINT teacher_student_diff CHECK (teacher_id IS DISTINCT FROM student_id)
);

-- Trigger to set updated_at on profiles

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to create profile on auth.users insert

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert minimal profile; default role = STUDENT
  INSERT INTO public.profiles (id, email, created_at, role)
  VALUES (NEW.id, NEW.email, now(), 'STUDENT')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auth_user_created ON auth.users;
CREATE TRIGGER auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Helpers to check roles and relations with SECURITY DEFINER to avoid recursive RLS
CREATE OR REPLACE FUNCTION helpers.is_role(p_uid uuid, p_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE public.profiles.id = p_uid AND public.profiles.role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION helpers.is_teacher_of(p_teacher uuid, p_student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.teacher_students WHERE public.teacher_students.teacher_id = p_teacher AND public.teacher_students.student_id = p_student
  );
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- Explicit schema/table privilege lockdown
REVOKE ALL ON SCHEMA helpers FROM PUBLIC;
GRANT USAGE ON SCHEMA helpers TO authenticated;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (first_name, last_name, phone) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

REVOKE ALL ON TABLE public.teacher_students FROM PUBLIC;
REVOKE ALL ON TABLE public.teacher_students FROM anon;
REVOKE ALL ON TABLE public.teacher_students FROM authenticated;

GRANT SELECT ON public.teacher_students TO authenticated;
GRANT INSERT, DELETE ON public.teacher_students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_students TO service_role;

-- Policies for profiles
-- Allow users to select their own profile
CREATE POLICY select_own_profile ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins to select any profile
CREATE POLICY select_profiles_admin ON public.profiles
FOR SELECT
TO authenticated
USING (helpers.is_role(auth.uid()::uuid, 'ADMIN'));

-- Allow teachers to select profiles of their assigned students
CREATE POLICY select_profiles_teacher_students ON public.profiles
FOR SELECT
TO authenticated
USING (
  helpers.is_role(auth.uid()::uuid, 'TEACHER')
  AND helpers.is_teacher_of(auth.uid()::uuid, id)
);

-- Allow users to update limited fields on own profile but not role
-- Update policy: allow authenticated users to update their own row (RLS),
-- column-level privileges will restrict which columns they can change.
CREATE POLICY update_own_profile ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policies for teacher_students
-- Teachers can select their relations
CREATE POLICY select_teacher_students_for_teacher ON public.teacher_students
FOR SELECT
TO authenticated
USING (
  helpers.is_role(auth.uid()::uuid, 'ADMIN')
  OR (helpers.is_role(auth.uid()::uuid, 'TEACHER') AND auth.uid() = teacher_id)
);

-- Students can select their own relation rows
CREATE POLICY select_teacher_students_for_student ON public.teacher_students
FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR helpers.is_role(auth.uid()::uuid, 'ADMIN'));

-- Admins can insert/delete teacher_students via admin client (policies allow if admin)
CREATE POLICY manage_teacher_students_admin ON public.teacher_students
FOR ALL
TO authenticated
USING (helpers.is_role(auth.uid()::uuid, 'ADMIN'));
