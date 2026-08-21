# Driving-School

Phase 1 implementation: Next.js + Supabase SSR integration, authentication, roles, and RLS schema.

Requirements
- Node >= 18
- Next.js (App Router)
- Supabase project (Postgres + Auth)

Environment
Copy `.env.example` to `.env.local` and fill values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Database migrations
- Apply the SQL migration in `db/migrations/001_init.sql` to your Supabase database (via SQL editor or `supabase` CLI).

Important notes
- The migration creates a `profiles` table and `teacher_students` join table, a trigger that creates `profiles` on `auth.users` insert, helper functions, and RLS policies.
- New users default to the `STUDENT` role. Do NOT rely on client-provided metadata for role assignment.

Creating the first admin (development)
1. Create a new user in Supabase Auth (Email + password) via the Supabase dashboard.
2. Using the SQL editor, set the user's role to ADMIN:

```sql
UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it to source control.

Running locally
1. Install dependencies (in an existing Next.js project):

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

What was added
- `src/lib/supabase/*` - browser, server, and admin Supabase clients plus session helper
- `src/lib/auth.ts` - server-side `requireUser` and `requireRole` helpers
- `src/app/(auth)/login/page.tsx` - login page
- `src/app/*` - root and role dashboards (admin/teacher/student)
- `src/app/api/auth/proxy.ts` - Supabase SSR proxy middleware for session refresh
- `db/migrations/001_init.sql` - DB schema, triggers, helpers, and RLS policies

Next steps
- Apply the migration to your Supabase project
- Configure `.env.local` with your Supabase keys
- Run the app and create the initial admin via the SQL step above
