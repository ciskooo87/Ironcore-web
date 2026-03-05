import { cookies } from "next/headers";
import { dbQuery } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const AUTH_COOKIE = "ironcore_session";

export type UserRole = "consultor" | "head" | "diretoria" | "admin_master";

export type SessionUser = {
  email: string;
  role: UserRole;
  name: string;
};

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  try {
    const q = await dbQuery<{ email: string; role: UserRole; name: string; password_hash: string }>(
      "select email, role, name, password_hash from users where email=$1 and active=true limit 1",
      [email.toLowerCase()]
    );
    const row = q.rows[0];
    if (row && (await verifyPassword(password, row.password_hash))) {
      return { email: row.email, role: row.role, name: row.name };
    }
  } catch {
    return null;
  }

  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(AUTH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as SessionUser;
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf-8").toString("base64url");
}
