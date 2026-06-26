import { postPath, type Post } from "@/lib/posts";
import Link from "next/link";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={postPath(post.slug)}
      className="group block overflow-hidden rounded-[1.25rem] bg-[#fffdf8] shadow-[0_1px_0_rgba(28,25,23,0.08),0_18px_45px_rgba(47,48,43,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_1px_0_rgba(47,111,115,0.28),0_24px_60px_rgba(47,111,115,0.14)] active:translate-y-0 md:flex"
    >
      {post.coverImage ? (
        <div className="overflow-hidden md:w-72 md:flex-none lg:w-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03] md:h-full"
          />
        </div>
      ) : null}
      <article className="min-w-0 flex-1 p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.views} 阅读</span>
          <span>·</span>
          <span>{post.commentCount} 评论</span>
        </div>
        <h3 className="mt-4 text-2xl font-semibold leading-snug text-stone-950 text-balance transition group-hover:text-[#24575a]">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 leading-7 text-stone-600">{post.excerpt}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
