import { getDb } from "@/lib/db";

export type PostStatus = "draft" | "published";

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category: string;
  tags: string[];
  coverImage: string;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: number;
  postId: number;
  author: string;
  content: string;
  status: "approved" | "hidden";
  createdAt: string;
};

type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category: string;
  tags: string;
  cover_image: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: number;
  post_id: number;
  author: string;
  content: string;
  status: "approved" | "hidden";
  created_at: string;
};

export type PostInput = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category: string;
  tags: string[];
  coverImage: string;
};

export type PostFilters = {
  includeDrafts?: boolean;
  query?: string;
  category?: string;
  tag?: string;
  limit?: number;
};

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    category: row.category,
    tags: splitTags(row.tags),
    coverImage: row.cover_image,
    views: row.views,
    likes: row.likes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    author: row.author,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function listPosts(filters: PostFilters = {}) {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (!filters.includeDrafts) {
    conditions.push("status = 'published'");
  }

  if (filters.query) {
    conditions.push(
      "(title LIKE @query OR excerpt LIKE @query OR content LIKE @query OR tags LIKE @query)",
    );
    params.query = `%${filters.query}%`;
  }

  if (filters.category) {
    conditions.push("category = @category");
    params.category = filters.category;
  }

  if (filters.tag) {
    conditions.push("tags LIKE @tag");
    params.tag = `%${filters.tag}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ? "LIMIT @limit" : "";

  if (filters.limit) {
    params.limit = filters.limit;
  }

  const rows = getDb()
    .prepare(`SELECT * FROM posts ${where} ORDER BY datetime(created_at) DESC ${limit}`)
    .all(params) as PostRow[];

  return rows.map(mapPost);
}

export function getPostBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const row = getDb()
    .prepare(
      `SELECT * FROM posts WHERE slug = ? ${
        options.includeDrafts ? "" : "AND status = 'published'"
      }`,
    )
    .get(slug) as PostRow | undefined;

  return row ? mapPost(row) : null;
}

export function getPostById(id: number) {
  const row = getDb()
    .prepare("SELECT * FROM posts WHERE id = ?")
    .get(id) as PostRow | undefined;

  return row ? mapPost(row) : null;
}

export function createPost(input: PostInput) {
  const now = new Date().toISOString();
  const slug = uniqueSlug(input.slug || input.title);

  const result = getDb()
    .prepare(
      `INSERT INTO posts (
        title, slug, excerpt, content, status, category, tags, cover_image,
        views, likes, created_at, updated_at
      )
       VALUES (
        @title, @slug, @excerpt, @content, @status, @category, @tags,
        @coverImage, 0, 0, @createdAt, @updatedAt
      )`,
    )
    .run({
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      category: input.category,
      tags: input.tags.join(","),
      coverImage: input.coverImage,
      createdAt: now,
      updatedAt: now,
    });

  return getPostById(Number(result.lastInsertRowid));
}

export function updatePost(id: number, input: PostInput) {
  const existing = getPostById(id);

  if (!existing) {
    return null;
  }

  const slug = uniqueSlug(input.slug || input.title, id);
  getDb()
    .prepare(
      `UPDATE posts
       SET title = @title,
           slug = @slug,
           excerpt = @excerpt,
           content = @content,
           status = @status,
           category = @category,
           tags = @tags,
           cover_image = @coverImage,
           updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      category: input.category,
      tags: input.tags.join(","),
      coverImage: input.coverImage,
      updatedAt: new Date().toISOString(),
    });

  return getPostById(id);
}

export function deletePost(id: number) {
  getDb().prepare("DELETE FROM comments WHERE post_id = ?").run(id);
  getDb().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

export function incrementViews(id: number) {
  getDb().prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(id);
}

export function likePost(id: number) {
  getDb().prepare("UPDATE posts SET likes = likes + 1 WHERE id = ?").run(id);
}

export function addComment(postId: number, author: string, content: string) {
  getDb()
    .prepare(
      `INSERT INTO comments (post_id, author, content, status, created_at)
       VALUES (?, ?, ?, 'approved', ?)`,
    )
    .run(postId, author, content, new Date().toISOString());
}

export function listComments(postId: number, includeHidden = false) {
  const rows = getDb()
    .prepare(
      `SELECT * FROM comments WHERE post_id = ? ${
        includeHidden ? "" : "AND status = 'approved'"
      } ORDER BY datetime(created_at) DESC`,
    )
    .all(postId) as CommentRow[];

  return rows.map(mapComment);
}

export function deleteComment(id: number) {
  getDb().prepare("DELETE FROM comments WHERE id = ?").run(id);
}

export function listAllComments() {
  const rows = getDb()
    .prepare("SELECT * FROM comments ORDER BY datetime(created_at) DESC")
    .all() as CommentRow[];

  return rows.map(mapComment);
}

export function listCategories() {
  const rows = getDb()
    .prepare(
      "SELECT category, COUNT(*) as count FROM posts WHERE status = 'published' GROUP BY category ORDER BY category ASC",
    )
    .all() as { category: string; count: number }[];

  return rows;
}

export function listTags() {
  const counts = new Map<string, number>();

  for (const post of listPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function getAdjacentPosts(post: Post) {
  const posts = listPosts();
  const index = posts.findIndex((item) => item.id === post.id);

  return {
    previous: index >= 0 ? posts[index + 1] || null : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export function getRelatedPosts(post: Post) {
  return listPosts({ limit: 8 })
    .filter((item) => item.id !== post.id)
    .filter(
      (item) =>
        item.category === post.category ||
        item.tags.some((tag) => post.tags.includes(tag)),
    )
    .slice(0, 3);
}

function uniqueSlug(value: string, currentId?: number) {
  const base = slugify(value);
  let candidate = base;
  let index = 2;

  while (slugExists(candidate, currentId)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function slugExists(slug: string, currentId?: number) {
  const row = getDb()
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(slug) as { id: number } | undefined;

  return Boolean(row && row.id !== currentId);
}

export function splitTags(value: string) {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || `post-${Date.now()}`;
}
