import { deletePostAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const posts = await listPosts({ includeDrafts: true });

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-stone-950">内容后台</h1>
            <p className="mt-2 text-stone-600">管理文章、草稿、评论和媒体。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/comments"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:border-stone-400"
            >
              评论
            </Link>
            <Link
              href="/admin/media"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:border-stone-400"
            >
              媒体
            </Link>
            <Link
              href="/admin/posts/new"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              新建文章
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1fr_110px_120px_180px] gap-4 border-b border-stone-200 px-5 py-3 text-sm font-semibold text-stone-500">
              <span>文章</span>
              <span>状态</span>
              <span>数据</span>
              <span>操作</span>
            </div>
            {posts.map((post) => (
              <div
                key={post.id}
                className="grid grid-cols-[1fr_110px_120px_180px] items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-0"
              >
                <div>
                  <p className="font-semibold text-stone-950">{post.title}</p>
                  <p className="mt-1 font-mono text-xs text-stone-500">/{post.slug}</p>
                  {post.tags.length ? (
                    <p className="mt-1 text-xs text-stone-500">
                      {post.tags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-stone-600">
                  {post.status === "published" ? "已发布" : "草稿"}
                </span>
                <span className="text-sm text-stone-600">
                  {post.views} 读 / {post.commentCount} 评论
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:border-stone-400"
                  >
                    编辑
                  </Link>
                  <form action={deletePostAction.bind(null, post.id)}>
                    <SubmitButton label="删除" pendingLabel="删除中..." variant="danger" />
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
