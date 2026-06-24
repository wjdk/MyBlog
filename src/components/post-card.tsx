import type { Post } from "@/lib/posts";
import Link from "next/link";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:border-[#2f6f73] hover:shadow-sm"
    >
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="h-44 w-full object-cover"
        />
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.category}</span>
          <span>·</span>
          <span>{post.views} 阅读</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-stone-950">{post.title}</h3>
        <p className="mt-3 line-clamp-3 leading-7 text-stone-600">{post.excerpt}</p>
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
