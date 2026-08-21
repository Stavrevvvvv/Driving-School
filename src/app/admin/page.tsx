import { requireRole } from '@/lib/auth';

export default async function AdminPage() {
  const profile = await requireRole('ADMIN');
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {profile.email}</p>
      <nav>
        <ul>
          <li>Users</li>
          <li>Schedule</li>
        </ul>
      </nav>
    </div>
  );
}
