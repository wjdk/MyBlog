import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  const posts = listPosts({ category: name });

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-semibold text-stone-950">分类：{name}</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
