// Centralized hostname/domain logic.
// Used to decide when the app should behave as the platform (landing/admin) vs a custom checkout domain.

const DEFAULT_PLATFORM_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "lovable.app",
  "lovableproject.com",
  // Platform domains (fallback): keep members/admin/landing working on primary domains.
  // If you change your primary domain, also update VITE_PLATFORM_DOMAINS.
  "gatteflow.store",
  "gateflow.store",
];

const normalize = (value: string) => value.trim().toLowerCase();

export const getPlatformDomains = (): string[] => {
  const raw = (import.meta as any).env?.VITE_PLATFORM_DOMAINS as string | undefined;
  const fromEnv = (raw || "")
    .split(",")
    .map(normalize)
    .filter(Boolean);

  // De-dup while preserving order (env first).
  const set = new Set<string>();
  for (const d of [...fromEnv, ...DEFAULT_PLATFORM_DOMAINS]) {
    set.add(d);
  }

  return Array.from(set);
};

export const isPlatformHostname = (hostname: string): boolean => {
  const host = normalize(hostname);
  const domains = getPlatformDomains();

  return domains.some((d) => {
    // Exact match
    if (host === d) return true;
    // Subdomain match (e.g., preview.lovable.app)
    if (host.endsWith(`.${d}`)) return true;
    return false;
  });
};

export const isCustomDomainHostname = (hostname: string): boolean => {
  return !isPlatformHostname(hostname);
};

export const getCustomDomainOrNull = (): string | null => {
  const hostname = window.location.hostname;
  return isCustomDomainHostname(hostname) ? hostname : null;
};
