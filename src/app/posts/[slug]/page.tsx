import { addCommentAction } from "@/app/actions";
import { MarkdownView } from "@/components/markdown-view";
import { SiteHeader } from "@/components/site-header";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
  incrementViews,
  listComments,
  postPath,
  type Comment,
} from "@/lib/posts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "文章不存在" };
  }

  return {
    title: `${post.title} | 我的博客`,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  await incrementViews(post.id);
  const [comments, related, adjacent, currentUser] = await Promise.all([
    listComments(post.id),
    getRelatedPosts(post),
    getAdjacentPosts(post),
    getCurrentUser(),
  ]);
  const commentTree = buildCommentTree(comments);

  return (
    <main id="main-content">
      <SiteHeader />
      <article>
        <section className="border-b border-stone-900/10">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:items-end lg:py-16">
            <div>
              <Link
                href="/"
                className="text-sm font-semibold text-[#2f6f73] transition hover:text-[#24575a]"
              >
                返回首页
              </Link>
              <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-sm text-stone-500">
                <span>{formatDate(post.createdAt)}</span>
                <span>·</span>
                <span>{post.views + 1} 阅读</span>
                <span>·</span>
                <span>{comments.length} 评论</span>
              </div>
              <h1 className="mt-5 max-w-4xl break-words font-serif text-4xl font-semibold leading-[1.08] text-stone-950 text-balance sm:text-5xl lg:text-6xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-6 max-w-2xl text-xl leading-9 text-stone-600 text-pretty">
                  {post.excerpt}
                </p>
              ) : null}
              {post.tags.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="rounded-md bg-white/70 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-[#2f6f73] hover:text-white"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="max-w-4xl rounded-[1.5rem] bg-[#fffdf8]/72 px-5 py-7 shadow-[0_1px_0_rgba(28,25,23,0.08),0_24px_70px_rgba(47,48,43,0.06)] sm:px-8 lg:px-10">
            <MarkdownView content={post.content} />
          </div>

          <nav className="mt-10 grid max-w-4xl gap-4 border-y border-stone-900/10 py-6 sm:grid-cols-2">
            <AdjacentLink label="上一篇" post={adjacent.previous} />
            <AdjacentLink label="下一篇" post={adjacent.next} alignRight />
          </nav>

          {related.length ? (
            <section className="mt-10 max-w-4xl">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">相关文章</h2>
              <div className="mt-5 space-y-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={postPath(item.slug)}
                    className="block rounded-2xl bg-[#fffdf8]/85 p-5 shadow-[0_1px_0_rgba(28,25,23,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(47,111,115,0.1)]"
                  >
                    <p className="font-semibold text-stone-950">{item.title}</p>
                    {item.excerpt ? (
                      <p className="mt-1 text-sm leading-6 text-stone-600">{item.excerpt}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section id="comments" className="mt-12 max-w-4xl">
            <h2 className="font-serif text-3xl font-semibold text-stone-950">评论</h2>
            {currentUser ? (
              <form
                action={addCommentAction.bind(null, post.id, post.slug)}
                className="mt-5 space-y-3 rounded-[1.25rem] bg-[#fffdf8]/85 p-5 shadow-[0_1px_0_rgba(28,25,23,0.08),0_18px_45px_rgba(47,48,43,0.06)]"
              >
                <p className="text-sm text-stone-500">
                  以 <strong className="text-stone-950">{currentUser.username}</strong> 的身份发表评论
                </p>
                <input type="hidden" name="submissionKey" value={randomUUID()} />
                <textarea
                  required
                  name="content"
                  rows={4}
                  className="w-full rounded-xl border border-stone-300 bg-white/80 px-3 py-2 outline-none transition focus:border-[#2f6f73]"
                  placeholder="写下你的想法"
                />
                <SubmitButton
                  label="发表评论"
                  pendingLabel="发表中..."
                  className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f6f73] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-stone-400"
                />
              </form>
            ) : (
              <div className="mt-5 rounded-[1.25rem] border border-dashed border-stone-300 bg-white/65 p-5 text-stone-600">
                登录后即可参与评论。
                <Link
                  href="/login"
                  className="ml-3 font-semibold text-[#2f6f73] transition hover:text-[#24575a]"
                >
                  去登录
                </Link>
              </div>
            )}
            <div className="mt-6 space-y-4">
              {commentTree.length ? (
                commentTree.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    slug={post.slug}
                    canReply={Boolean(currentUser)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/55 p-5 text-stone-600">
                  暂时还没有评论，欢迎留下第一条想法。
                </div>
              )}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}

type CommentNode = Comment & {
  replies: CommentNode[];
};

function CommentThread({
  comment,
  postId,
  slug,
  canReply,
}: {
  comment: CommentNode;
  postId: number;
  slug: string;
  canReply: boolean;
}) {
  return (
    <div className="space-y-3">
      <article
        id={`comment-${comment.id}`}
        className="rounded-2xl bg-white/75 p-4 shadow-[0_1px_0_rgba(28,25,23,0.08)]"
      >
        <div className="flex justify-between gap-3 text-sm text-stone-500">
          <strong className="text-stone-950">{comment.author}</strong>
          <span className="font-mono">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-stone-700">
          {comment.content}
        </p>
        <details className="mt-3">
          <summary className="w-fit cursor-pointer list-none rounded-md px-2 py-1 text-sm font-semibold text-[#2f6f73] transition hover:bg-[#2f6f73]/10">
            回复
          </summary>
          {canReply ? (
            <form
              action={addCommentAction.bind(null, postId, slug)}
              className="mt-3 space-y-3 rounded-xl border border-stone-200 bg-[#fffdf8]/80 p-3"
            >
              <input type="hidden" name="parentId" value={comment.id} />
              <input type="hidden" name="submissionKey" value={randomUUID()} />
              <textarea
                required
                name="content"
                rows={3}
                className="w-full rounded-xl border border-stone-300 bg-white/80 px-3 py-2 outline-none transition focus:border-[#2f6f73]"
                placeholder={`回复 ${comment.author}`}
              />
              <SubmitButton
                label="发表回复"
                pendingLabel="发表中..."
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f6f73] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-stone-400"
              />
            </form>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white/65 p-3 text-sm text-stone-600">
              登录后即可回复。
              <Link
                href="/login"
                className="ml-2 font-semibold text-[#2f6f73] transition hover:text-[#24575a]"
              >
                去登录
              </Link>
            </div>
          )}
        </details>
      </article>
      {comment.replies.length ? (
        <div className="ml-4 space-y-3 border-l border-stone-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              slug={slug}
              canReply={canReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildCommentTree(comments: Comment[]) {
  const commentsById = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const comment of comments) {
    commentsById.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = commentsById.get(comment.id);
    if (!node) {
      continue;
    }

    const parent = comment.parentId ? commentsById.get(comment.parentId) : null;
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
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
      href={postPath(post.slug)}
      className={`block rounded-2xl px-3 py-2 transition hover:bg-white/60 ${
        alignRight ? "text-right" : ""
      }`}
    >
      <span className="text-sm text-stone-500">{label}</span>
      <p className="mt-1 font-semibold text-stone-950 transition hover:text-[#2f6f73]">
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
