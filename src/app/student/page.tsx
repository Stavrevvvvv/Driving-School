import { requireRole } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export default async function StudentPage() {
  const profile = await requireRole('STUDENT');
  return (
    <div style={{ padding: 24 }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, {profile.email}</p>
      <LogoutButton />
      <nav>
        <ul>
          <li>My Schedule</li>
        </ul>
      </nav>
    </div>
  );
}
