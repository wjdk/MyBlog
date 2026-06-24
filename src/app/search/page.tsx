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
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-stone-950">搜索</h1>
        <p className="mt-2 text-stone-600">
          {q ? `关键词：${q}，找到 ${posts.length} 篇文章。` : "请输入关键词搜索文章。"}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
