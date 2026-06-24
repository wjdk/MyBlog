import { logoutAction } from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";

export async function SiteHeader() {
  const admin = await isAdmin();

  return (
    <header className="border-b border-stone-200 bg-[#f7f6f2]/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="text-lg font-semibold text-stone-950">
          我的博客
        </Link>
        <form action="/search" className="order-3 flex w-full max-w-sm md:order-2">
          <input
            name="q"
            className="h-9 flex-1 rounded-l-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#2f6f73]"
            placeholder="搜索文章"
          />
          <button className="h-9 rounded-r-md bg-stone-950 px-3 text-sm font-medium text-white">
            搜索
          </button>
        </form>
        <nav className="order-2 flex items-center gap-1 text-sm font-medium text-stone-600 md:order-3">
          <Link className="rounded-md px-3 py-2 hover:bg-white hover:text-stone-950" href="/">
            首页
          </Link>
          <Link
            className="rounded-md px-3 py-2 hover:bg-white hover:text-stone-950"
            href="/archive"
          >
            归档
          </Link>
          {admin ? (
            <>
              <Link
                className="rounded-md px-3 py-2 hover:bg-white hover:text-stone-950"
                href="/admin"
              >
                后台
              </Link>
              <form action={logoutAction}>
                <button className="rounded-md px-3 py-2 hover:bg-white hover:text-stone-950">
                  退出
                </button>
              </form>
            </>
          ) : (
            <Link
              className="rounded-md px-3 py-2 hover:bg-white hover:text-stone-950"
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
