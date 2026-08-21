import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (!user) {
    // unauthenticated; show public home or redirect to login
    return (<div style={{ padding: 24 }}>
      <h1>Driving School</h1>
      <p>Welcome. Please <a href="/login">login</a>.</p>
    </div>);
  }

  // fetch profile to determine role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role;
  switch (role) {
    case 'ADMIN':
      redirect('/admin');
    case 'TEACHER':
      redirect('/teacher');
    default:
      redirect('/student');
  }
}
