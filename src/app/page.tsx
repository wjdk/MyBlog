import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { listPosts, listTags } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, tags] = await Promise.all([listPosts(), listTags()]);

  return (
    <main id="main-content">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-stone-900/10">
        <div className="pointer-events-none absolute -right-32 top-12 size-[30rem] rounded-full border border-[#2f6f73]/10" />
        <div className="pointer-events-none absolute -right-12 top-32 size-72 rounded-full border border-[#2f6f73]/10" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:px-10 lg:pb-24 lg:pt-24">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#2f6f73]">
              CHIYU JOURNAL · 池鱼手记
            </p>
            <p className="mt-7 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg sm:leading-9 sm:text-pretty">
              收录项目开发笔记，学习笔记，技术笔记和生活日常。
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/admin/posts/new"
                className="inline-flex items-center gap-3 rounded-lg bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(28,25,23,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#24575a] active:translate-y-0"
              >
                写新文章 <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/archive"
                className="border-b border-stone-400 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#2f6f73] hover:text-[#24575a]"
              >
                浏览全部归档
              </Link>
            </div>
          </div>

          <div className="border-y border-stone-900/15 py-5 lg:mb-2">
            <p className="text-xs font-medium tracking-[0.16em] text-stone-500">站点收录</p>
            <div className="mt-6 grid grid-cols-2 divide-x divide-stone-900/15">
              <Stat value={posts.length} label="文章" />
              <Stat value={tags.length} label="标签" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-10 lg:py-24">
        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between border-b border-stone-900/15 pb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#2f6f73]">LATEST</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">最新文章</h2>
            </div>
            <span className="font-mono text-sm text-stone-400">{String(posts.length).padStart(2, "0")}</span>
          </div>

          {posts.length === 0 ? (
            <div className="border-b border-stone-900/15 py-14 text-stone-600">
              <p className="font-serif text-2xl font-semibold text-stone-950">这里还很安静</p>
              <p className="mt-3 leading-7">第一篇文章发布后，会从这里开始生长。</p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="border-t border-stone-900/20 pt-5">
            <h2 className="font-serif text-xl font-semibold text-stone-950">按主题阅读</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/tags/${encodeURIComponent(item.tag)}`}
                  className="rounded-md border border-stone-900/10 bg-white/45 px-3 py-1.5 text-sm text-stone-600 transition hover:border-[#2f6f73]/40 hover:bg-[#2f6f73] hover:text-white"
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
    <div className="min-w-0 px-5 first:pl-0">
      <div className="font-serif text-4xl font-semibold tabular-nums text-stone-950">{value}</div>
      <div className="mt-2 text-xs text-stone-500">{label}</div>
    </div>
  );
}
