import { SiteHeader } from "@/components/site-header";
import { listPosts, postPath } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const posts = await listPosts();

  return (
    <main id="main-content">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#2f6f73]">ARCHIVE</p>
        <h1 className="mt-4 break-words font-serif text-4xl font-semibold text-stone-950 text-balance sm:text-5xl">
          文章归档
        </h1>
        <div className="mt-9 space-y-3">
          {posts.length ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href={postPath(post.slug)}
                className="grid gap-2 rounded-2xl bg-[#fffdf8]/82 p-5 shadow-[0_1px_0_rgba(28,25,23,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(47,111,115,0.1)] sm:grid-cols-[8rem_1fr]"
              >
                <span className="font-mono text-sm text-stone-500">
                  {new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(
                    new Date(post.createdAt),
                  )}
                </span>
                <span className="font-semibold text-stone-950">{post.title}</span>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 p-8 text-stone-600">
              暂时还没有可归档的文章。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
