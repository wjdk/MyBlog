import type { ImportedPostInput, ImportConflictStrategy, Post } from "@/lib/posts";

export const POST_EXPORT_FORMAT = "blog-posts-json";
export const POST_EXPORT_VERSION = 1;

export type PostExportItem = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published";
  tags: string[];
  coverImage: string;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type PostExportFile = {
  format: typeof POST_EXPORT_FORMAT;
  version: typeof POST_EXPORT_VERSION;
  exportedAt: string;
  posts: PostExportItem[];
};

export function buildPostExport(posts: Post[]): PostExportFile {
  return {
    format: POST_EXPORT_FORMAT,
    version: POST_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    posts: posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      tags: post.tags,
      coverImage: post.coverImage,
      views: post.views,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })),
  };
}

export function parsePostImportJson(value: string): ImportedPostInput[] {
  const parsed = JSON.parse(value) as Partial<PostExportFile> | { posts?: unknown };
  const posts = Array.isArray(parsed.posts) ? parsed.posts : null;

  if (!posts) {
    throw new Error("JSON 文件必须包含 posts 数组");
  }

  return posts.map(normalizeImportItem);
}

export function normalizeConflictStrategy(value: FormDataEntryValue | null): ImportConflictStrategy {
  if (value === "overwrite" || value === "rename") {
    return value;
  }

  return "skip";
}

function normalizeImportItem(item: unknown): ImportedPostInput {
  if (!item || typeof item !== "object") {
    throw new Error("posts 数组中存在无效文章");
  }

  const post = item as Record<string, unknown>;

  return {
    title: stringValue(post.title),
    slug: stringValue(post.slug),
    excerpt: stringValue(post.excerpt),
    content: stringValue(post.content),
    status: post.status === "published" ? "published" : "draft",
    tags: Array.isArray(post.tags)
      ? post.tags.map(String)
      : stringValue(post.tags).split(","),
    coverImage: stringValue(post.coverImage),
    createdAt: stringValue(post.createdAt),
    updatedAt: stringValue(post.updatedAt),
    views: numberValue(post.views),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
}
