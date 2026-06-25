import { deleteImageAction, uploadImageAction } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { list, type ListBlobResultBlob } from "@vercel/blob";
import Link from "next/link";

type MediaPageProps = {
  searchParams: Promise<{ url?: string; error?: string; deleted?: string }>;
};

type MediaListState = {
  blobs: ListBlobResultBlob[];
  failed: boolean;
};

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: MediaPageProps) {
  await requireAdmin();
  const { url, error, deleted } = await searchParams;
  const media = await getBlogImages();
  const errorMessage = getErrorMessage(error);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-stone-950">图片管理</h1>
            <p className="mt-2 text-stone-600">
              上传和管理保存在 Vercel Blob 的博客图片。
            </p>
          </div>
          <p className="rounded-md bg-stone-100 px-3 py-2 font-mono text-xs text-stone-600">
            blog/
          </p>
        </div>

        <form
          action={uploadImageAction}
          className="mt-8 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-stone-950">上传图片</h2>
            <p className="mt-1 text-sm text-stone-600">
              上传成功后，图片会出现在下方列表中。
            </p>
          </div>

          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          {deleted ? <p className="text-sm text-[#2f6f73]">图片已删除。</p> : null}
          {url ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">上传成功</p>
              <code className="mt-2 block break-all rounded bg-white/80 px-3 py-2 text-sm text-emerald-950">
                {url}
              </code>
            </div>
          ) : null}

          <input
            required
            type="file"
            name="image"
            accept="image/*"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
          <SubmitButton label="上传" pendingLabel="上传中..." />
        </form>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-stone-950">已上传图片</h2>
              <p className="mt-1 text-sm text-stone-600">
                当前显示 Blob Store 中 `blog/` 前缀下的图片。
              </p>
            </div>
            <p className="text-sm text-stone-500">{media.blobs.length} 张图片</p>
          </div>

          {media.failed ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              图片列表加载失败，请检查 Vercel Blob 是否已连接到当前项目。
            </p>
          ) : null}

          {media.blobs.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {media.blobs.map((blob) => (
                <article
                  key={blob.pathname}
                  className="overflow-hidden rounded-lg border border-stone-200 bg-white"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={blob.url}
                      alt={blob.pathname}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <h3 className="truncate text-sm font-semibold text-stone-950">
                        {getFileName(blob.pathname)}
                      </h3>
                      <p className="mt-1 break-all font-mono text-xs text-stone-500">
                        {blob.pathname}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-xs text-stone-600">
                      <div>
                        <dt className="font-medium text-stone-500">大小</dt>
                        <dd className="mt-1">{formatBytes(blob.size)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-stone-500">上传时间</dt>
                        <dd className="mt-1">{formatDate(blob.uploadedAt)}</dd>
                      </div>
                    </dl>

                    <code className="block max-h-24 overflow-auto break-all rounded-md bg-stone-100 px-3 py-2 text-xs text-stone-700">
                      {blob.url}
                    </code>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={blob.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:border-stone-400"
                      >
                        打开图片
                      </a>
                      <CopyButton value={blob.url} />
                      <form action={deleteImageAction.bind(null, blob.pathname)}>
                        <SubmitButton
                          label="删除"
                          pendingLabel="删除中..."
                          variant="danger"
                        />
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <p className="font-medium text-stone-900">暂无图片</p>
              <p className="mt-2 text-sm text-stone-600">上传第一张图片后会显示在这里。</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

async function getBlogImages(): Promise<MediaListState> {
  try {
    const { blobs } = await list({ prefix: "blog/", limit: 100 });

    return {
      blobs: blobs.sort(
        (first, second) => second.uploadedAt.getTime() - first.uploadedAt.getTime(),
      ),
      failed: false,
    };
  } catch {
    return { blobs: [], failed: true };
  }
}

function getErrorMessage(error?: string) {
  if (error === "upload") {
    return "上传失败，请检查 Vercel Blob 连接、图片大小或稍后重试。";
  }

  if (error === "delete") {
    return "删除失败，请稍后重试。";
  }

  if (error === "delete-scope") {
    return "只能删除 blog/ 前缀下的博客图片。";
  }

  if (error) {
    return "请选择一张图片。";
  }

  return "";
}

function getFileName(pathname: string) {
  return pathname.split("/").pop() || pathname;
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
