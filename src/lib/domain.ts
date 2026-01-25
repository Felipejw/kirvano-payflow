const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase().replace(/\.+$/, "");

const parseCsv = (value: string | undefined) => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const getHostname = () => normalizeHostname(window.location.hostname);

export const getPlatformDomains = () => {
  // CSV: "gateflow.store,www.gateflow.store"
  const envValue = (import.meta as any).env?.VITE_PLATFORM_DOMAINS as string | undefined;
  const domains = parseCsv(envValue).map(normalizeHostname);

  // Always treat local development as platform.
  const local = ["localhost", "127.0.0.1"];

  // Hardcoded fallback domains to prevent routing issues if env is misconfigured
  const fallbackDomains = [
    "gateflow.store",
    "www.gateflow.store",
    "gatteflow.store",
    "www.gatteflow.store"
  ];

  // If env is missing, keep behavior safe by defaulting to platform for localhost only.
  return Array.from(new Set([...local, ...fallbackDomains, ...domains]));
};

export const isPlatformDomain = (hostnameInput?: string) => {
  const hostname = normalizeHostname(hostnameInput ?? window.location.hostname);
  // Always treat Lovable preview/published subdomains as platform.
  if (hostname === "lovable.app" || hostname.endsWith(".lovable.app")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;

  const platforms = getPlatformDomains();
  return platforms.includes(hostname);
};

export const isCustomDomain = (hostnameInput?: string) => {
  return !isPlatformDomain(hostnameInput);
};
