import { loginAction, registerAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; mode?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "用户名或密码不正确。",
  reserved: "admin 是保留用户名，不能注册。",
  username: "用户名需要 3-30 位，只能包含小写字母、数字和下划线。",
  email: "请输入有效的邮箱地址。",
  password: "密码至少需要 8 位。",
  exists: "用户名或邮箱已经被注册。",
  database: "数据库未配置，暂时不能注册账号。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, mode } = await searchParams;
  const isRegister = mode === "register";
  const message = error ? errorMessages[error] || "操作失败，请重试。" : "";

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-stone-950">
              {isRegister ? "注册账号" : "登录"}
            </h1>
          </div>
          <Link
            href={isRegister ? "/login" : "/login?mode=register"}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-[#2f6f73] hover:text-[#2f6f73]"
          >
            {isRegister ? "去登录" : "去注册"}
          </Link>
        </div>

        <form
          action={isRegister ? registerAction : loginAction}
          className="mt-8 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
        >
          {message ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-stone-700">用户名</span>
            <input
              required
              name="username"
              autoComplete="username"
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
            />
          </label>

          {isRegister ? (
            <label className="block">
              <span className="text-sm font-medium text-stone-700">邮箱</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-stone-700">密码</span>
            <input
              required
              type="password"
              name="password"
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
            />
          </label>

          <SubmitButton
            label={isRegister ? "注册并登录" : "登录"}
            pendingLabel={isRegister ? "注册中..." : "登录中..."}
          />
        </form>
      </section>
    </main>
  );
}
