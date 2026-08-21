import { redirect } from 'next/navigation';
import { createServerSupabase } from './supabase/server';
import { UserRole } from '@/types';

type Profile = {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string | null;
  last_name?: string | null;
};

export async function requireUser() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // If profile missing, sign out and send to login
    redirect('/login');
  }

  return { user, profile: profile as Profile };
}

export async function requireRole(allowed: UserRole | UserRole[]) {
  const { profile } = await requireUser();
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedArr.includes(profile.role as UserRole)) {
    // redirect to their dashboard
    switch (profile.role) {
      case 'ADMIN':
        redirect('/admin');
      case 'TEACHER':
        redirect('/teacher');
      default:
        redirect('/student');
    }
  }
  return profile;
}
