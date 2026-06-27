import {
  deleteAudioAction,
  deleteImageAction,
  deleteUnusedImagesAction,
  renameAudioAction,
  renameImageAction,
  replaceAudioAction,
  replaceImageAction,
  uploadAudioAction,
  uploadImageAction,
} from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { FileSubmitButton } from "@/components/file-submit-button";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { list, type ListBlobResultBlob } from "@vercel/blob";
import Link from "next/link";

type MediaPageProps = {
  searchParams: Promise<{
    url?: string;
    error?: string;
    deleted?: string;
    audioDeleted?: string;
    replaced?: string;
    audioReplaced?: string;
    renamed?: string;
    audioRenamed?: string;
    cleanupDeleted?: string;
    cleanupFailed?: string;
    audioUrl?: string;
  }>;
};

type MediaListState = {
  images: ListBlobResultBlob[];
  audios: ListBlobResultBlob[];
  failed: boolean;
};

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: MediaPageProps) {
  await requireAdmin();
  const {
    url,
    error,
    deleted,
    audioDeleted,
    replaced,
    audioReplaced,
    renamed,
    audioRenamed,
    cleanupDeleted,
    cleanupFailed,
    audioUrl,
  } = await searchParams;
  const media = await getBlogMedia();
  const errorMessage = getErrorMessage(error);
  const cleanupDeletedCount = Number(cleanupDeleted || 0);
  const cleanupFailedCount = Number(cleanupFailed || 0);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold text-stone-950">媒体管理</h1>
        </div>

        <form
          action={uploadImageAction}
          className="mt-8 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
        >
          <h2 className="text-lg font-semibold text-stone-950">上传图片</h2>

          {errorMessage && !isAudioError(error) ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          {deleted ? <p className="text-sm text-[#2f6f73]">图片已删除。</p> : null}
          {replaced ? <p className="text-sm text-[#2f6f73]">图片已替换，地址保持不变。</p> : null}
          {renamed ? <p className="text-sm text-[#2f6f73]">图片已重命名，文章引用已同步更新。</p> : null}
          {cleanupDeleted !== undefined ? (
            <p className="text-sm text-[#2f6f73]">
              已删除 {cleanupDeletedCount} 张未引用图片
              {cleanupFailedCount ? `，${cleanupFailedCount} 张删除失败` : ""}。
            </p>
          ) : null}

          {url ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">上传成功</p>
              <code className="mt-2 block break-all rounded bg-white/80 px-3 py-2 text-sm text-emerald-950">
                {url}
              </code>
            </div>
          ) : null}

          <FileSubmitButton
            name="image"
            accept="image/*"
            label="上传"
            pendingLabel="上传中..."
            variant="dropzone"
            dropLabel="拖拽图片到此处上传"
          />
        </form>

        <form
          action={uploadAudioAction}
          className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
        >
          <h2 className="text-lg font-semibold text-stone-950">上传音频</h2>

          {errorMessage && isAudioError(error) ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          {audioDeleted ? <p className="text-sm text-[#2f6f73]">音频已删除。</p> : null}
          {audioReplaced ? <p className="text-sm text-[#2f6f73]">音频已替换，地址保持不变。</p> : null}
          {audioRenamed ? <p className="text-sm text-[#2f6f73]">音频已重命名，文章引用已同步更新。</p> : null}

          {audioUrl ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">音频上传成功</p>
              <code className="mt-2 block break-all rounded bg-white/80 px-3 py-2 text-sm text-emerald-950">
                {audioUrl}
              </code>
              <code className="mt-2 block break-all rounded bg-white/80 px-3 py-2 text-sm text-emerald-950">
                {toAudioMarkdown(audioUrl)}
              </code>
            </div>
          ) : null}

          <FileSubmitButton
            name="audio"
            accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm"
            label="上传"
            pendingLabel="上传中..."
            variant="dropzone"
            dropLabel="拖拽音频到此处上传"
          />
        </form>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-950">已上传图片</h2>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-stone-500">{media.images.length} 张图片</p>
              <form action={deleteUnusedImagesAction}>
                <SubmitButton
                  label="删除未引用图片"
                  pendingLabel="清理中..."
                  variant="danger"
                />
              </form>
            </div>
          </div>

          {media.failed ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              图片列表加载失败，请稍后重试。
            </p>
          ) : null}

          {media.images.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {media.images.map((blob) => (
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

                    <form
                      action={renameImageAction.bind(null, blob.pathname, blob.url)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        name="name"
                        defaultValue={getFileBaseName(blob.pathname)}
                        className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-[#2f6f73]"
                        aria-label="图片新文件名"
                      />
                      <SubmitButton label="重命名" pendingLabel="重命名中..." />
                    </form>

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
                      <form action={replaceImageAction.bind(null, blob.pathname)}>
                        <FileSubmitButton
                          name="image"
                          accept="image/*"
                          label="替换"
                          pendingLabel="替换中..."
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
              <p className="mt-2 text-sm text-stone-600">
                上传第一张图片后会显示在这里。
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-950">已上传音频</h2>
            <p className="text-sm text-stone-500">{media.audios.length} 个音频</p>
          </div>

          {media.audios.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {media.audios.map((blob) => (
                <article key={blob.pathname} className="rounded-lg border border-stone-200 bg-white p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="truncate text-sm font-semibold text-stone-950">
                        {getFileName(blob.pathname)}
                      </h3>
                      <p className="mt-1 break-all font-mono text-xs text-stone-500">
                        {blob.pathname}
                      </p>
                    </div>

                    <audio className="w-full" controls preload="metadata">
                      <source src={blob.url} />
                    </audio>

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
                      {toAudioMarkdown(blob.url, getFileName(blob.pathname))}
                    </code>

                    <form
                      action={renameAudioAction.bind(null, blob.pathname, blob.url)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        name="name"
                        defaultValue={getFileBaseName(blob.pathname)}
                        className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-[#2f6f73]"
                        aria-label="音频新文件名"
                      />
                      <SubmitButton label="重命名" pendingLabel="重命名中..." />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={blob.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:border-stone-400"
                      >
                        打开音频
                      </a>
                      <CopyButton
                        value={toAudioMarkdown(blob.url, getFileName(blob.pathname))}
                        label="复制 Markdown 链接"
                      />
                      <CopyButton value={blob.url} />
                      <form action={deleteAudioAction.bind(null, blob.pathname)}>
                        <SubmitButton label="删除" pendingLabel="删除中..." variant="danger" />
                      </form>
                      <form action={replaceAudioAction.bind(null, blob.pathname)}>
                        <FileSubmitButton
                          name="audio"
                          accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm"
                          label="替换"
                          pendingLabel="替换中..."
                        />
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <p className="font-medium text-stone-900">暂无音频</p>
              <p className="mt-2 text-sm text-stone-600">上传第一个音频后会显示在这里。</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

async function getBlogMedia(): Promise<MediaListState> {
  try {
    const blobs: ListBlobResultBlob[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await list({ prefix: "blog/", limit: 1000, cursor });
      blobs.push(...page.blobs);
      cursor = page.cursor;
      hasMore = page.hasMore;
    }

    const sortedBlobs = blobs.sort(
      (first, second) => second.uploadedAt.getTime() - first.uploadedAt.getTime(),
    );

    return {
      images: sortedBlobs.filter((blob) => isImagePath(blob.pathname)),
      audios: sortedBlobs.filter((blob) => isAudioPath(blob.pathname)),
      failed: false,
    };
  } catch {
    return { images: [], audios: [], failed: true };
  }
}

function getErrorMessage(error?: string) {
  if (error === "audio-file") {
    return "请选择一个音频文件。";
  }

  if (error === "audio-upload") {
    return "音频上传失败，请检查文件大小或稍后重试。";
  }

  if (error === "audio-delete" || error === "audio-delete-scope") {
    return "音频删除失败，请稍后重试。";
  }

  if (error === "audio-replace-file") {
    return "请选择要替换的新音频。";
  }

  if (error === "audio-replace" || error === "audio-replace-scope") {
    return "音频替换失败，请检查文件大小或稍后重试。";
  }

  if (error === "audio-rename-file") {
    return "请输入新的音频文件名。";
  }

  if (error === "audio-rename" || error === "audio-rename-scope") {
    return "音频重命名失败，请检查文件名是否已存在或稍后重试。";
  }

  if (error === "upload") {
    return "上传失败，请检查图片大小或稍后重试。";
  }

  if (error === "delete") {
    return "删除失败，请稍后重试。";
  }

  if (error === "cleanup-db") {
    return "数据库暂时不可用，未执行未引用图片清理。";
  }

  if (error === "cleanup") {
    return "未引用图片清理失败，请稍后重试。";
  }

  if (error === "delete-scope") {
    return "只能删除图片管理里的图片。";
  }

  if (error === "replace-scope") {
    return "只能替换图片管理里的图片。";
  }

  if (error === "replace-file") {
    return "请选择要替换的新图片。";
  }

  if (error === "replace") {
    return "替换失败，请检查图片大小或稍后重试。";
  }

  if (error === "rename-file") {
    return "请输入新的图片文件名。";
  }

  if (error === "rename" || error === "rename-scope") {
    return "图片重命名失败，请检查文件名是否已存在或稍后重试。";
  }

  if (error) {
    return "请选择一张图片。";
  }

  return "";
}

function isAudioError(error?: string) {
  return Boolean(error?.startsWith("audio-"));
}

function toAudioMarkdown(url: string, title = "音频") {
  return `@[audio: ${title}](${url})`;
}

function isImagePath(pathname: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(pathname);
}

function isAudioPath(pathname: string) {
  return /^blog\/audio\//.test(pathname) && /\.(aac|flac|m4a|mp3|oga|ogg|wav|webm)(?:[?#].*)?$/i.test(pathname);
}

function getFileName(pathname: string) {
  return pathname.split("/").pop() || pathname;
}

function getFileBaseName(pathname: string) {
  return getFileName(pathname).replace(/\.[^.]+$/, "");
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
