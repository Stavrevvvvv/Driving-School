"use client";

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setPending(false);
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <button type="button" onClick={handleLogout} disabled={pending}>
      {pending ? 'Signing out...' : 'Logout'}
    </button>
  );
}
