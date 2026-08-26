import { requireRole } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';
import {
  buildAssignmentsByTeacher,
  fetchAdminAssignmentData,
} from '@/lib/teacher-students';
import { AssignmentManager } from './assignment-manager';
import { formatProfileName } from '@/lib/people';

export default async function AdminPage() {
  const profile = await requireRole('ADMIN');
  const { teachers, students, assignments } = await fetchAdminAssignmentData();
  const groupedAssignments = buildAssignmentsByTeacher(assignments, students);

  const assignmentsByTeacher = Object.fromEntries(
    teachers.map((teacher) => [teacher.id, groupedAssignments.get(teacher.id) ?? []])
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {formatProfileName(profile)} ({profile.email})</p>
      <LogoutButton />
      <AssignmentManager
        teachers={teachers}
        students={students}
        assignmentsByTeacher={assignmentsByTeacher}
      />
    </div>
  );
}
