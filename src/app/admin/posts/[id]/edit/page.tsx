import { updatePostAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { PostForm } from "@/components/post-form";
import { requireAdmin } from "@/lib/auth";
import { getPostById } from "@/lib/posts";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin();
  const { id } = await params;
  const post = await getPostById(Number(id));

  if (!post) {
    notFound();
  }

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">编辑文章</h1>
        <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6">
          <PostForm
            action={updatePostAction.bind(null, post.id)}
            post={post}
            submitLabel="更新文章"
          />
        </div>
      </section>
    </main>
  );
}
