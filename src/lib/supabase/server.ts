import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function createServerSupabase() {
  // Follow official @supabase/ssr + Next.js cookie adapter pattern
  const cookieStore = await cookies();

  const adapter = {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
        });
      } catch {
        // Cookie writes may fail from Server Components; proxy handles session refresh.
      }
    },
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, { cookies: adapter });
}
