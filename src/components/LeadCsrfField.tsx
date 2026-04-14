"use client";

import { useEffect, useState } from "react";

const CSRF_COOKIE = "ironcore_csrf";

function createCsrfToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const parts = document.cookie.split(/;\s*/);
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export default function LeadCsrfField() {
  const [token, setToken] = useState("");

  useEffect(() => {
    let current = readCookie(CSRF_COOKIE);
    if (!current) {
      current = createCsrfToken();
      document.cookie = `${CSRF_COOKIE}=${encodeURIComponent(current)}; Path=/; SameSite=Lax; Secure`;
    }
    setToken(current);
  }, []);

  return <input type="hidden" name="csrf_token" value={token} />;
}
