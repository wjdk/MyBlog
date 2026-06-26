import {
  importPostsWithImagesAction,
  localizeExistingPostImagesAction,
} from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

type ImportExportPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    skipped?: string;
    failed?: string;
    imagesUploaded?: string;
    imagesFailed?: string;
    syncedPosts?: string;
    error?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ImportExportPage({ searchParams }: ImportExportPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const hasResult = Boolean(
    params.created ||
      params.updated ||
      params.skipped ||
      params.failed ||
      params.syncedPosts ||
      params.imagesUploaded ||
      params.imagesFailed,
  );

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold text-stone-950">博文导入导出</h1>
          <p className="mt-2 text-stone-600">
            批量备份或迁移文章，导入时可以自动把远程图片搬到 Vercel Blob。
          </p>
        </div>

        {params.error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error === "file" ? "请选择一个 JSON 文件。" : decodeURIComponent(params.error)}
          </p>
        ) : null}

        {hasResult ? (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">导入完成</p>
            <p className="mt-1">
              新增 {params.created || 0} 篇，更新 {params.updated || 0} 篇，跳过{" "}
              {params.skipped || 0} 篇，失败 {params.failed || 0} 篇。
            </p>
            {params.syncedPosts ? (
              <p className="mt-1">同步现有文章图片链接 {params.syncedPosts} 篇。</p>
            ) : null}
            <p className="mt-1">
              图片迁移成功 {params.imagesUploaded || 0} 张，失败{" "}
              {params.imagesFailed || 0} 张。
            </p>
            {params.message ? <p className="mt-2">{params.message}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-stone-950">导出博文</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              下载当前数据库里的全部文章，适合迁移前备份或跨环境同步。
            </p>
            <a
              href="/api/admin/posts/export"
              className="mt-6 inline-flex rounded-md bg-[#2f6f73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25595c]"
            >
              下载 JSON
            </a>
          </section>

          <form
            action={importPostsWithImagesAction}
            className="space-y-5 rounded-lg border border-stone-200 bg-white p-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-stone-950">导入博文</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                上传从本站导出的 JSON，可一次导入多篇文章。
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">JSON 文件</span>
              <input
                required
                type="file"
                name="postsFile"
                accept="application/json,.json"
                className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">slug 冲突处理</span>
              <select
                name="conflictStrategy"
                defaultValue="skip"
                className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
              >
                <option value="skip">跳过已有文章</option>
                <option value="overwrite">覆盖已有文章</option>
                <option value="rename">自动改名后导入</option>
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-3">
              <input
                type="checkbox"
                name="localizeImages"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-stone-300 accent-[#2f6f73]"
              />
              <span>
                <span className="block text-sm font-medium text-stone-800">
                  迁移远程图片到 Vercel Blob
                </span>
                <span className="mt-1 block text-sm leading-6 text-stone-600">
                  自动解析 Markdown 图片、HTML img 标签和封面图，上传成功后替换文章里的链接。
                </span>
              </span>
            </label>

            <SubmitButton label="开始导入" pendingLabel="导入中..." />
          </form>
        </div>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">同步现有博文图片</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                扫描已经导入的文章，把正文和封面里的远程图片上传到 Vercel Blob，并替换文章链接。
              </p>
            </div>
            <form action={localizeExistingPostImagesAction}>
              <SubmitButton label="同步图片" pendingLabel="同步中..." />
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">JSON 格式</h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-stone-100 p-4 text-xs leading-5 text-stone-700">
{`{
  "format": "blog-posts-json",
  "version": 1,
  "exportedAt": "2026-06-26T00:00:00.000Z",
  "posts": [
    {
      "title": "文章标题",
      "slug": "post-slug",
      "excerpt": "摘要",
      "content": "Markdown 正文，支持 ![](https://...) 和 <img src=\\"https://...\\" />",
      "status": "published",
      "tags": ["Next.js", "博客"],
      "coverImage": "https://example.com/cover.jpg",
      "views": 0,
      "createdAt": "2026-06-26T00:00:00.000Z",
      "updatedAt": "2026-06-26T00:00:00.000Z"
    }
  ]
}`}
          </pre>
        </section>
      </section>
    </main>
  );
}
