import { loginAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl font-semibold text-stone-950">管理员登录</h1>
        <p className="mt-2 text-stone-600">
          默认密码是 admin123，可以通过环境变量 ADMIN_PASSWORD 修改。
        </p>
        <form action={loginAction} className="mt-8 rounded-lg border border-stone-200 bg-white p-6">
          {error ? (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              密码不正确。
            </p>
          ) : null}
          <label className="block">
            <span className="text-sm font-medium text-stone-700">密码</span>
            <input
              required
              type="password"
              name="password"
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
            />
          </label>
          <button className="mt-5 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
            登录
          </button>
        </form>
      </section>
    </main>
  );
}
