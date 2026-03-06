function normalizeBasePath(input?: string | null) {
  if (!input) return "";
  const p = input.trim();
  if (!p || p === "/") return "";
  return p.startsWith("/") ? p.replace(/\/$/, "") : `/${p.replace(/\/$/, "")}`;
}

export function getPublicOrigin(req: Request) {
  const envOrigin = process.env.APP_PUBLIC_URL?.trim();
  if (envOrigin) {
    try {
      return new URL(envOrigin).origin;
    } catch {
      // fallback para headers
    }
  }

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
  return `${proto}://${host}`;
}

export function publicUrl(req: Request, path: string) {
  const basePath = normalizeBasePath(process.env.APP_BASE_PATH || req.headers.get("x-forwarded-prefix"));
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withBase = basePath && !normalizedPath.startsWith(`${basePath}/`) && normalizedPath !== basePath
    ? `${basePath}${normalizedPath}`
    : normalizedPath;

  return new URL(withBase, getPublicOrigin(req));
}
