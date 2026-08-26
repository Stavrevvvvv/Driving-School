export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type Profile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type ProfileSummary = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: UserRole;
};

export type TeacherStudentAssignment = {
  teacher_id: string;
  student_id: string;
  created_at?: string | null;
};
