import { requireRole } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';
import { formatProfileName } from '@/lib/people';
import { fetchAssignedTeachers } from '@/lib/teacher-students';

export default async function StudentPage() {
  const profile = await requireRole('STUDENT');
  const teachers = await fetchAssignedTeachers(profile.id);
  return (
    <div style={{ padding: 24 }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, {formatProfileName(profile)} ({profile.email})</p>
      <LogoutButton />
      <section>
        <h2>Assigned teachers</h2>
        {teachers.length > 0 ? (
          <ul>
            {teachers.map((teacher) => (
              <li key={teacher.id}>
                <div>{formatProfileName(teacher)}</div>
                <div>{teacher.email}</div>
                {teacher.phone ? <div>{teacher.phone}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No teachers have been assigned yet.</p>
        )}
      </section>
    </div>
  );
}
