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
    <main id="main-content">
      <SiteHeader />
      <section className="border-b border-stone-900/10">
        <div className="mx-auto grid max-w-6xl gap-10 overflow-hidden px-5 pb-16 pt-14 lg:grid-cols-[1fr_340px] lg:items-end lg:overflow-visible lg:pt-20">
          <div className="min-w-0 max-w-[20rem] sm:max-w-none">
            <p className="text-sm font-semibold tracking-[0.28em] text-[#2f6f73]">
              CHIYU JOURNAL
            </p>
            <p className="mt-6 max-w-[20rem] text-base leading-8 text-stone-600 sm:max-w-full sm:text-lg sm:text-pretty lg:max-w-2xl">
              收录项目开发笔记，学习笔记，生活日常和绘画记录。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/admin/posts/new"
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(28,25,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#24575a] active:translate-y-0"
              >
                写新文章
              </Link>
              <Link
                href="/archive"
                className="rounded-full border border-stone-300/90 bg-white/65 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5 hover:border-[#2f6f73] hover:bg-white active:translate-y-0"
              >
                浏览归档
              </Link>
            </div>
          </div>
          <div className="w-full min-w-0 max-w-[20rem] overflow-hidden rounded-[1.5rem] bg-stone-950 p-6 text-white shadow-[0_24px_70px_rgba(28,25,23,0.25)] sm:max-w-full">
            <p className="text-sm text-stone-300">当前内容</p>
            <div className="mt-6 grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <Stat value={posts.length} label="文章" />
              <Stat value={categories.length} label="分类" />
              <Stat value={tags.length} label="标签" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-stone-950">最新文章</h2>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 p-8 text-stone-600">
              <p className="text-lg font-semibold text-stone-950">还没有已发布文章</p>
              <p className="mt-2">去后台创建第一篇，首页会自动更新。</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:pt-14">
          <div className="rounded-[1.25rem] bg-[#fffdf8]/90 p-5 shadow-[0_1px_0_rgba(28,25,23,0.08),0_18px_45px_rgba(47,48,43,0.06)]">
            <h2 className="font-semibold text-stone-950">分类</h2>
            <div className="mt-4 space-y-2">
              {categories.map((item) => (
                <Link
                  key={item.category}
                  href={`/categories/${encodeURIComponent(item.category)}`}
                  className="flex justify-between rounded-lg px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
                >
                  <span>{item.category}</span>
                  <span className="font-mono tabular-nums">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-[#fffdf8]/90 p-5 shadow-[0_1px_0_rgba(28,25,23,0.08),0_18px_45px_rgba(47,48,43,0.06)]">
            <h2 className="font-semibold text-stone-950">标签</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/tags/${encodeURIComponent(item.tag)}`}
                  className="rounded-md bg-stone-100 px-3 py-1.5 text-sm text-stone-600 transition hover:-translate-y-0.5 hover:bg-[#2f6f73] hover:text-white"
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/8 p-3">
      <div className="font-mono text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-stone-300">{label}</div>
    </div>
  );
}
