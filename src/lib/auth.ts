import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "blog_admin";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === getAdminPassword();
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/login");
  }
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, getAdminPassword(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
