'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { isRole } from '@/lib/teacher-students';

export type AssignmentActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : null;
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

type ValidationResult =
  | { supabase: ServerSupabase; error: string }
  | { supabase: ServerSupabase };

async function validateParticipants(teacherId: string, studentId: string): Promise<ValidationResult> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', [teacherId, studentId]);

  if (error) {
    return { supabase, error: error.message };
  }

  const teacher = data?.find((profile) => profile.id === teacherId);
  const student = data?.find((profile) => profile.id === studentId);

  if (!teacher) {
    return { supabase, error: 'Selected teacher was not found.' };
  }

  if (!student) {
    return { supabase, error: 'Selected student was not found.' };
  }

  if (!isRole(teacher.role) || teacher.role !== 'TEACHER') {
    return { supabase, error: 'The selected teacher account is not a teacher.' };
  }

  if (!isRole(student.role) || student.role !== 'STUDENT') {
    return { supabase, error: 'The selected student account is not a student.' };
  }

  if (teacherId === studentId) {
    return { supabase, error: 'A user cannot be assigned to themselves.' };
  }

  return { supabase };
}

function refreshAssignmentPages() {
  revalidatePath('/admin');
  revalidatePath('/teacher');
  revalidatePath('/student');
}

export async function assignStudentToTeacher(
  _previousState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  await requireRole('ADMIN');

  const teacherId = getField(formData, 'teacher_id');
  const studentId = getField(formData, 'student_id');

  if (!teacherId || !studentId) {
    return { status: 'error', message: 'Select both a teacher and a student.' };
  }

  const validation = await validateParticipants(teacherId, studentId);
  if ('error' in validation) {
    return { status: 'error', message: validation.error };
  }

  const { supabase } = validation;
  const { error } = await supabase.from('teacher_students').insert({
    teacher_id: teacherId,
    student_id: studentId,
  });

  if (error) {
    if (error.code === '23505') {
      return {
        status: 'error',
        message: 'That student is already assigned to that teacher.',
      };
    }

    return { status: 'error', message: error.message };
  }

  refreshAssignmentPages();
  return { status: 'success', message: 'Student assigned to teacher.' };
}

export async function removeStudentFromTeacher(
  _previousState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  await requireRole('ADMIN');

  const teacherId = getField(formData, 'teacher_id');
  const studentId = getField(formData, 'student_id');

  if (!teacherId || !studentId) {
    return { status: 'error', message: 'Missing teacher or student identifier.' };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('teacher_students')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .select('teacher_id');

  if (error) {
    return { status: 'error', message: error.message };
  }

  if (!data || data.length === 0) {
    return { status: 'error', message: 'That assignment was not found.' };
  }

  refreshAssignmentPages();
  return { status: 'success', message: 'Assignment removed.' };
}
