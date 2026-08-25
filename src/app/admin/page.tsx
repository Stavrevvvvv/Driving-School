import { requireRole } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export default async function AdminPage() {
  const profile = await requireRole('ADMIN');
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {profile.email}</p>
      <LogoutButton />
      <nav>
        <ul>
          <li>Users</li>
          <li>Schedule</li>
        </ul>
      </nav>
    </div>
  );
}
