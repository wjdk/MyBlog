import { postPath, type Post } from "@/lib/posts";
import Link from "next/link";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={postPath(post.slug)}
      className="group block border-b border-stone-900/15 py-7 transition duration-300 md:grid md:grid-cols-[minmax(0,1fr)_12rem] md:gap-8 md:py-9"
    >
      {post.coverImage ? (
        <div className="order-2 overflow-hidden rounded-xl bg-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        </div>
      ) : null}
      <article className="min-w-0 py-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.views} 阅读</span>
          <span>·</span>
          <span>{post.commentCount} 评论</span>
        </div>
        <h3 className="mt-4 font-serif text-2xl font-semibold leading-snug text-stone-950 text-balance transition group-hover:text-[#24575a] sm:text-3xl">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-4 line-clamp-3 max-w-2xl leading-8 text-stone-600">{post.excerpt}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-[#2f6f73]">
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
