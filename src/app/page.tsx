import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { listCategories, listPosts, listTags } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, categories, tags] = await Promise.all([
    listPosts(),
    listCategories(),
    listTags(),
  ]);

  return (
    <main>
      <SiteHeader />
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2f6f73]">
            Personal Dynamic Blog
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
            记录想法、项目和长期积累的个人博客。
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            支持文章、分类、标签、搜索、评论、点赞、浏览量、RSS、Sitemap 和后台管理。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/posts/new"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              写新文章
            </Link>
            <Link
              href="/archive"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:border-stone-400"
            >
              浏览归档
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-950">最新文章</h2>
              <p className="mt-2 text-sm text-stone-600">只展示已发布内容。</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-stone-600">
              还没有已发布文章。去后台创建第一篇吧。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-950">分类</h2>
            <div className="mt-4 space-y-2">
              {categories.map((item) => (
                <Link
                  key={item.category}
                  href={`/categories/${encodeURIComponent(item.category)}`}
                  className="flex justify-between rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                >
                  <span>{item.category}</span>
                  <span>{item.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-950">标签</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/tags/${encodeURIComponent(item.tag)}`}
                  className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600 hover:bg-[#2f6f73] hover:text-white"
                >
                  #{item.tag}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
