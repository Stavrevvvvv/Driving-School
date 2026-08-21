import { requireRole } from '@/lib/auth';

export default async function TeacherPage() {
  const profile = await requireRole('TEACHER');
  return (
    <div style={{ padding: 24 }}>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {profile.email}</p>
      <nav>
        <ul>
          <li>Students</li>
          <li>Schedule</li>
        </ul>
      </nav>
    </div>
  );
}
