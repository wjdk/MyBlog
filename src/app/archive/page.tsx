import { SiteHeader } from "@/components/site-header";
import { listPosts } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const posts = await listPosts();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-stone-950">文章归档</h1>
        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="flex gap-4 rounded-lg border border-stone-200 bg-white p-4 hover:border-[#2f6f73]"
            >
              <span className="w-28 shrink-0 font-mono text-sm text-stone-500">
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(
                  new Date(post.createdAt),
                )}
              </span>
              <span className="font-semibold text-stone-950">{post.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
