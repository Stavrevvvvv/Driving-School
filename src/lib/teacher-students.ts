import 'server-only';

import { createServerSupabase } from '@/lib/supabase/server';
import type { ProfileSummary, TeacherStudentAssignment } from '@/types';
import type { UserRole } from '@/types';

export type AdminAssignmentData = {
  teachers: ProfileSummary[];
  students: ProfileSummary[];
  assignments: TeacherStudentAssignment[];
};

export function formatProfileName(profile: {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return name || profile.email;
}

function sortPeople(a: ProfileSummary, b: ProfileSummary) {
  const last = (a.last_name ?? '').localeCompare(b.last_name ?? '');
  if (last !== 0) return last;
  const first = (a.first_name ?? '').localeCompare(b.first_name ?? '');
  if (first !== 0) return first;
  return a.email.localeCompare(b.email);
}

export async function fetchAdminAssignmentData(): Promise<AdminAssignmentData> {
  const supabase = await createServerSupabase();
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, role')
    .order('email', { ascending: true });

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('teacher_students')
    .select('teacher_id, student_id, created_at')
    .order('created_at', { ascending: true });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const profilesList = (profiles ?? []) as ProfileSummary[];
  const teachers = profilesList.filter((profile) => profile.role === 'TEACHER').sort(sortPeople);
  const students = profilesList.filter((profile) => profile.role === 'STUDENT').sort(sortPeople);

  return {
    teachers,
    students,
    assignments: (assignments ?? []) as TeacherStudentAssignment[],
  };
}

export async function fetchAssignedStudents(teacherId: string): Promise<ProfileSummary[]> {
  const supabase = await createServerSupabase();
  const { data: links, error: linksError } = await supabase
    .from('teacher_students')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const studentIds = (links ?? []).map((link) => link.student_id);
  if (studentIds.length === 0) {
    return [];
  }

  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, role')
    .in('id', studentIds)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  return ((students ?? []) as ProfileSummary[]).filter((student) => student.role === 'STUDENT').sort(sortPeople);
}

export async function fetchAssignedTeachers(studentId: string): Promise<ProfileSummary[]> {
  const supabase = await createServerSupabase();
  const { data: relations, error: relationError } = await supabase
    .from('teacher_students')
    .select('teacher_id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });

  if (relationError) {
    throw new Error(relationError.message);
  }

  const teacherIds = [...new Set((relations ?? []).map((relation) => relation.teacher_id))];
  if (teacherIds.length === 0) {
    return [];
  }

  const { data: teacher, error: teacherError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, role')
    .in('id', teacherIds);

  if (teacherError) {
    throw new Error(teacherError.message);
  }

  return ((teacher ?? []) as ProfileSummary[]).filter((profile) => profile.role === 'TEACHER').sort(sortPeople);

}

export function buildAssignmentsByTeacher(
  assignments: TeacherStudentAssignment[],
  students: ProfileSummary[]
) {
  const studentLookup = new Map(students.map((student) => [student.id, student]));
  const grouped = new Map<string, ProfileSummary[]>();

  assignments.forEach((assignment) => {
    const student = studentLookup.get(assignment.student_id);
    if (!student) {
      return;
    }

    const list = grouped.get(assignment.teacher_id) ?? [];
    list.push(student);
    grouped.set(assignment.teacher_id, list);
  });

  return grouped;
}

export function isRole(value: string | null | undefined): value is UserRole {
  return value === 'ADMIN' || value === 'TEACHER' || value === 'STUDENT';
}
