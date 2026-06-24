import { addCommentAction, likePostAction } from "@/app/actions";
import { MarkdownView } from "@/components/markdown-view";
import { SiteHeader } from "@/components/site-header";
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
  incrementViews,
  listComments,
} from "@/lib/posts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "文章不存在" };
  }

  return {
    title: `${post.title} | 我的博客`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  incrementViews(post.id);
  const comments = listComments(post.id);
  const related = getRelatedPosts(post);
  const adjacent = getAdjacentPosts(post);

  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回首页
        </Link>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-lg object-cover"
          />
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <Link href={`/categories/${encodeURIComponent(post.category)}`}>{post.category}</Link>
          <span>·</span>
          <span>{post.views + 1} 阅读</span>
          <span>·</span>
          <span>{post.likes} 赞</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">{post.excerpt}</p>
        {post.tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600 hover:bg-[#2f6f73] hover:text-white"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="mt-10 border-t border-stone-200 pt-8">
          <MarkdownView content={post.content} />
        </div>

        <form action={likePostAction.bind(null, post.id, post.slug)} className="mt-10">
          <button className="rounded-md bg-[#2f6f73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25595c]">
            点赞这篇文章
          </button>
        </form>

        <nav className="mt-10 grid gap-4 border-y border-stone-200 py-6 sm:grid-cols-2">
          <AdjacentLink label="上一篇" post={adjacent.previous} />
          <AdjacentLink label="下一篇" post={adjacent.next} alignRight />
        </nav>

        {related.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-stone-950">相关文章</h2>
            <div className="mt-4 space-y-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/posts/${item.slug}`}
                  className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-[#2f6f73]"
                >
                  <p className="font-semibold text-stone-950">{item.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section id="comments" className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-950">评论</h2>
          <form
            action={addCommentAction.bind(null, post.id, post.slug)}
            className="mt-5 space-y-3 rounded-lg border border-stone-200 bg-white p-5"
          >
            <input
              required
              name="author"
              className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
              placeholder="你的名字"
            />
            <textarea
              required
              name="content"
              rows={4}
              className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-[#2f6f73]"
              placeholder="写下你的想法"
            />
            <button className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
              发表评论
            </button>
          </form>
          <div className="mt-6 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex justify-between gap-3 text-sm text-stone-500">
                  <strong className="text-stone-950">{comment.author}</strong>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-3 leading-7 text-stone-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

function AdjacentLink({
  label,
  post,
  alignRight,
}: {
  label: string;
  post: { slug: string; title: string } | null;
  alignRight?: boolean;
}) {
  if (!post) {
    return <div />;
  }

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={alignRight ? "text-right" : undefined}
    >
      <span className="text-sm text-stone-500">{label}</span>
      <p className="mt-1 font-semibold text-stone-950 hover:text-[#2f6f73]">
        {post.title}
      </p>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(value));
}
