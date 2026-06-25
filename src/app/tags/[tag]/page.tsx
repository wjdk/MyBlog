import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  const posts = await listPosts({ tag: name });

  return (
    <main id="main-content">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#2f6f73]">TAG</p>
        <h1 className="mt-4 break-words font-serif text-4xl font-semibold text-stone-950 text-balance sm:text-5xl">
          #{name}
        </h1>
        {posts.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 p-8 text-stone-600">
            这个标签下暂时没有已发布文章。
          </div>
        )}
      </section>
    </main>
  );
}
