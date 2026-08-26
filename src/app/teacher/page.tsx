import { requireRole } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';
import { formatProfileName } from '@/lib/people';
import { fetchAssignedStudents } from '@/lib/teacher-students';

export default async function TeacherPage() {
  const profile = await requireRole('TEACHER');
  const students = await fetchAssignedStudents(profile.id);
  return (
    <div style={{ padding: 24 }}>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {formatProfileName(profile)} ({profile.email})</p>
      <LogoutButton />
      <section>
        <h2>Assigned students</h2>
        {students.length === 0 ? (
          <p>No students are assigned to you yet.</p>
        ) : (
          <ul style={{ paddingLeft: 20 }}>
            {students.map((student) => (
              <li key={student.id} style={{ marginBottom: 12 }}>
                <div>{formatProfileName(student)}</div>
                <div>{student.email}</div>
                {student.phone ? <div>{student.phone}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
