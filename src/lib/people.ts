export function formatProfileName(profile: {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return name || profile.email;
}
