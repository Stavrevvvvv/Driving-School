-- Tighten teacher/student assignment policies and allow students to read their assigned teacher.

DROP POLICY IF EXISTS manage_teacher_students_admin ON public.teacher_students;
DROP POLICY IF EXISTS select_teacher_profile_for_student ON public.profiles;

CREATE POLICY select_teacher_profile_for_student ON public.profiles
FOR SELECT
TO authenticated
USING (
  helpers.is_role(auth.uid()::uuid, 'STUDENT')
  AND helpers.is_teacher_of(public.profiles.id, auth.uid()::uuid)
);

CREATE POLICY insert_teacher_students_admin ON public.teacher_students
FOR INSERT
TO authenticated
WITH CHECK (
  helpers.is_role(auth.uid()::uuid, 'ADMIN')
  AND helpers.is_role(teacher_id, 'TEACHER')
  AND helpers.is_role(student_id, 'STUDENT')
  AND teacher_id <> student_id
);

CREATE POLICY delete_teacher_students_admin ON public.teacher_students
FOR DELETE
TO authenticated
USING (helpers.is_role(auth.uid()::uuid, 'ADMIN'));