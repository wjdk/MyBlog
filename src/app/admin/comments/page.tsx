import { deleteCommentAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";
import { getPostById, listAllComments } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CommentsAdminPage() {
  await requireAdmin();
  const comments = listAllComments();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">评论管理</h1>
        <div className="mt-8 space-y-4">
          {comments.map((comment) => {
            const post = getPostById(comment.postId);
            return (
              <div key={comment.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">{comment.author}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {post ? post.title : "文章已删除"}
                    </p>
                  </div>
                  <form action={deleteCommentAction.bind(null, comment.id)}>
                    <button className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                      删除评论
                    </button>
                  </form>
                </div>
                <p className="mt-4 leading-7 text-stone-700">{comment.content}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
