import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const admin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#fbf8f1]/82 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-normal text-stone-950 transition hover:text-[#2f6f73]"
        >
          池鱼<span className="text-[#2f6f73]">手记</span>
        </Link>
        <form
          action="/search"
          className="order-3 flex w-full min-w-0 max-w-[calc(100vw-2.5rem)] md:order-2 md:max-w-sm"
        >
          <input
            name="q"
            className="h-10 min-w-0 flex-1 rounded-l-full border border-stone-300/80 bg-white/70 px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#2f6f73] focus:bg-white"
            placeholder="搜索文章"
          />
          <button className="h-10 shrink-0 rounded-r-full bg-stone-950 px-3 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-[#2f6f73] active:translate-y-0 sm:px-4">
            搜索
          </button>
        </form>
        <nav className="order-2 flex items-center gap-1 text-sm font-medium text-stone-600 md:order-3">
          <Link
            className="rounded-full px-3 py-2 transition hover:bg-white/80 hover:text-stone-950"
            href="/"
          >
            首页
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition hover:bg-white/80 hover:text-stone-950"
            href="/archive"
          >
            归档
          </Link>
          {user ? (
            <>
              {admin ? (
                <Link
                  className="rounded-full px-3 py-2 transition hover:bg-white/80 hover:text-stone-950"
                  href="/admin"
                >
                  后台
                </Link>
              ) : null}
              <span className="max-w-32 truncate rounded-full px-3 py-2 text-stone-500">
                {user.username}
              </span>
              <form action={logoutAction}>
                <button className="rounded-full px-3 py-2 transition hover:bg-white/80 hover:text-stone-950">
                  退出
                </button>
              </form>
            </>
          ) : (
            <Link
              className="rounded-full px-3 py-2 transition hover:bg-white/80 hover:text-stone-950"
              href="/login"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
