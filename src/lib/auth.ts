import { ensureSchema, getSql, hasDatabase } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const COOKIE_NAME = "blog_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_USERNAME = "admin";
const PASSWORD_MIN_LENGTH = 8;
const scrypt = promisify(scryptCallback);

export type SessionRole = "admin" | "user";

export type CurrentUser = {
  id: string;
  username: string;
  email?: string;
  role: SessionRole;
};

type SessionRow = {
  id: string;
  user_id: string | null;
  role: SessionRole;
};

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
};

type AuthResult =
  | { ok: true; user: CurrentUser }
  | {
      ok: false;
      error: "invalid" | "reserved" | "username" | "email" | "password" | "exists" | "database";
    };

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD must be set in production.");
  }

  return password || "admin123";
}

export function verifyAdminPassword(password: string) {
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(getAdminPassword());

  return (
    passwordBuffer.length === expectedBuffer.length &&
    timingSafeEqual(passwordBuffer, expectedBuffer)
  );
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername || !password) {
    return { ok: false, error: "invalid" };
  }

  if (normalizedUsername === ADMIN_USERNAME) {
    if (!verifyAdminPassword(password)) {
      return { ok: false, error: "invalid" };
    }

    return { ok: true, user: adminUser() };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "invalid" };
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, username, email, password_hash
    FROM users
    WHERE username = ${normalizedUsername}
    LIMIT 1
  `;
  const user = rows[0] as UserRow | undefined;

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, error: "invalid" };
  }

  return {
    ok: true,
    user: {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: "user",
    },
  };
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  if (!isValidUsername(normalizedUsername)) {
    return { ok: false, error: "username" };
  }

  if (normalizedUsername === ADMIN_USERNAME) {
    return { ok: false, error: "reserved" };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: "email" };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: "password" };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "database" };
  }

  await ensureSchema();
  const sql = getSql();
  const existing = await sql`
    SELECT id
    FROM users
    WHERE username = ${normalizedUsername} OR email = ${normalizedEmail}
    LIMIT 1
  `;

  if (existing[0]) {
    return { ok: false, error: "exists" };
  }

  const passwordHash = await hashPassword(password);

  try {
    const rows = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${normalizedUsername}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, username, email
    `;
    const user = rows[0] as UserRow;

    return {
      ok: true,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        role: "user",
      },
    };
  } catch {
    return { ok: false, error: "exists" };
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  if (session.role === "admin") {
    return adminUser();
  }

  if (!session.user_id) {
    return null;
  }

  const userId = Number(session.user_id);
  if (!Number.isSafeInteger(userId)) {
    return null;
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, username, email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const user = rows[0] as UserRow | undefined;

  if (!user) {
    return null;
  }

  return {
    id: String(user.id),
    username: user.username,
    email: user.email,
    role: "user",
  };
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/login");
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function setUserSession(user: CurrentUser) {
  const sessionId = await createSession(user.role, user.id);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId && hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE id = ${hashSessionId(sessionId)}
    `;
  }

  cookieStore.delete(COOKIE_NAME);
}

function adminUser(): CurrentUser {
  return {
    id: ADMIN_USERNAME,
    username: ADMIN_USERNAME,
    role: "admin",
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt$${salt}$${key.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, storedKey] = passwordHash.split("$");
  if (scheme !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(storedKey, "base64url");

  return key.length === storedBuffer.length && timingSafeEqual(key, storedBuffer);
}

function createSessionId() {
  return randomBytes(32).toString("base64url");
}

function hashSessionId(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("base64url");
}

async function createSession(role: SessionRole, userId: string) {
  await ensureSchema();
  const sql = getSql();
  const sessionId = createSessionId();
  const sessionHash = hashSessionId(sessionId);

  await sql`
    INSERT INTO sessions (id, user_id, role, expires_at)
    VALUES (
      ${sessionHash},
      ${userId},
      ${role},
      NOW() + (${SESSION_MAX_AGE_SECONDS} * INTERVAL '1 second')
    )
  `;

  return sessionId;
}

async function getCurrentSession() {
  if (!hasDatabase()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const sessionHash = hashSessionId(sessionId);
  const rows = await sql`
    UPDATE sessions
    SET last_seen_at = NOW()
    WHERE id = ${sessionHash}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    RETURNING id, user_id, role
  `;

  return (rows[0] as SessionRow | undefined) || null;
}
