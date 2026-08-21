import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function middleware(req: NextRequest) {
  // Use server client backed by incoming request cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: req.cookies });

  // Attempt to get session; this will trigger refresh if needed
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;

    const res = NextResponse.next();

    // If a refreshed session is present, propagate tokens as cookies
    if (session?.access_token) {
      // Set standard Supabase client cookies so server client picks them up
      res.cookies.set('sb-access-token', session.access_token, { httpOnly: true });
      if (session.refresh_token) {
        res.cookies.set('sb-refresh-token', session.refresh_token, { httpOnly: true });
      }
    }

    return res;
  } catch (err) {
    console.error('Supabase proxy error', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/admin/:path*', '/teacher/:path*', '/student/:path*'],
};
