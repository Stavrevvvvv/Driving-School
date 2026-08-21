import { requireRole } from '@/lib/auth';

export default async function StudentPage() {
  const profile = await requireRole('STUDENT');
  return (
    <div style={{ padding: 24 }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, {profile.email}</p>
      <nav>
        <ul>
          <li>My Schedule</li>
        </ul>
      </nav>
    </div>
  );
}
