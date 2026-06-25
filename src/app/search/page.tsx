import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const posts = q ? await listPosts({ query: q }) : [];

  return (
    <main id="main-content">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#2f6f73]">SEARCH</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-stone-950 sm:text-5xl">搜索</h1>
        <p className="mt-4 text-stone-600">
          {q ? `关键词：${q}，找到 ${posts.length} 篇文章。` : "请输入关键词搜索文章。"}
        </p>
        {posts.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 p-8 text-stone-600">
            {q ? "没有找到匹配文章，换个关键词试试。" : "在顶部输入关键词后，这里会显示搜索结果。"}
          </div>
        )}
      </section>
    </main>
  );
}
