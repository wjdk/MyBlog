import { createPostAction } from "@/app/actions";
import { PostForm } from "@/components/post-form";
import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function NewPostPage() {
  await requireAdmin();
  const submissionKey = crypto.randomUUID();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">新建文章</h1>
        <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6">
          <PostForm
            action={createPostAction}
            submitLabel="保存文章"
            submissionKey={submissionKey}
          />
        </div>
      </section>
    </main>
  );
}
