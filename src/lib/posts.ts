import { ensureSchema, getSql, hasDatabase } from "@/lib/db";

export type PostStatus = "draft" | "published";

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  tags: string[];
  coverImage: string;
  views: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: number;
  postId: number;
  userId: string | null;
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
  tags: string;
  cover_image: string;
  views: number;
  comment_count?: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type CommentRow = {
  id: number;
  post_id: number;
  user_id: string | null;
  author: string;
  username?: string | null;
  content: string;
  status: "approved" | "hidden";
  created_at: string | Date;
};

export type PostInput = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  tags: string[];
  coverImage: string;
  submissionKey?: string;
};

export type PostFilters = {
  includeDrafts?: boolean;
  query?: string;
  tag?: string;
  limit?: number;
};

function unavailablePosts(): Post[] {
  return [];
}

function mapPost(row: PostRow): Post {
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    tags: splitTags(row.tags),
    coverImage: row.cover_image,
    views: Number(row.views),
    commentCount: Number(row.comment_count || 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: Number(row.id),
    postId: Number(row.post_id),
    userId: row.user_id,
    author: row.username || row.author,
    content: row.content,
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

export async function listPosts(filters: PostFilters = {}) {
  if (!hasDatabase()) {
    return unavailablePosts();
  }

  await ensureSchema();
  const sql = getSql();
  const limit = filters.limit || 100;
  const includeDrafts = Boolean(filters.includeDrafts);

  const rows = await sql`
    SELECT
      posts.*,
      (
        SELECT COUNT(*)::int
        FROM comments
        WHERE comments.post_id = posts.id
          AND comments.status = 'approved'
      ) AS comment_count
    FROM posts
    WHERE
      (${includeDrafts}::boolean OR status = 'published')
      AND (${filters.query || null}::text IS NULL OR (
        title ILIKE ${`%${filters.query || ""}%`}
        OR excerpt ILIKE ${`%${filters.query || ""}%`}
        OR content ILIKE ${`%${filters.query || ""}%`}
        OR tags ILIKE ${`%${filters.query || ""}%`}
      ))
      AND (${filters.tag || null}::text IS NULL OR tags ILIKE ${`%${filters.tag || ""}%`})
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return (rows as PostRow[]).map(mapPost);
}

export async function getPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const candidates = postSlugCandidates(slug);
  const rows = await sql`
    SELECT
      posts.*,
      (
        SELECT COUNT(*)::int
        FROM comments
        WHERE comments.post_id = posts.id
          AND comments.status = 'approved'
      ) AS comment_count
    FROM posts
    WHERE (
      slug = ${candidates[0]}
      OR slug = ${candidates[1]}
      OR slug = ${candidates[2]}
    )
      AND (${options.includeDrafts || false}::boolean OR status = 'published')
    LIMIT 1
  `;
  const row = rows[0] as PostRow | undefined;

  return row ? mapPost(row) : null;
}

export async function getPostById(id: number) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      posts.*,
      (
        SELECT COUNT(*)::int
        FROM comments
        WHERE comments.post_id = posts.id
          AND comments.status = 'approved'
      ) AS comment_count
    FROM posts
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0] as PostRow | undefined;

  return row ? mapPost(row) : null;
}

export async function createPost(input: PostInput) {
  await ensureSchema();
  const sql = getSql();
  const slug = await uniqueSlug(input.slug || input.title);
  const submissionKey = input.submissionKey || null;
  const rows = submissionKey
    ? await sql`
        INSERT INTO posts (
          title, slug, excerpt, content, status, tags, cover_image,
          views, submission_key, created_at, updated_at
        )
        VALUES (
          ${input.title}, ${slug}, ${input.excerpt}, ${input.content},
          ${input.status}, ${input.tags.join(",")},
          ${input.coverImage}, 0, ${submissionKey}, NOW(), NOW()
        )
        ON CONFLICT (submission_key) DO UPDATE
        SET submission_key = EXCLUDED.submission_key
        RETURNING *
      `
    : await sql`
        INSERT INTO posts (
          title, slug, excerpt, content, status, tags, cover_image,
          views, created_at, updated_at
        )
        VALUES (
          ${input.title}, ${slug}, ${input.excerpt}, ${input.content},
          ${input.status}, ${input.tags.join(",")},
          ${input.coverImage}, 0, NOW(), NOW()
        )
        RETURNING *
      `;

  return mapPost(rows[0] as PostRow);
}

export async function updatePost(id: number, input: PostInput) {
  const existing = await getPostById(id);

  if (!existing) {
    return null;
  }

  const sql = getSql();
  const slug = await uniqueSlug(input.slug || input.title, id);
  const rows = await sql`
    UPDATE posts
    SET title = ${input.title},
        slug = ${slug},
        excerpt = ${input.excerpt},
        content = ${input.content},
        status = ${input.status},
        tags = ${input.tags.join(",")},
        cover_image = ${input.coverImage},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return rows[0] ? mapPost(rows[0] as PostRow) : null;
}

export async function deletePost(id: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

export async function incrementViews(id: number) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();
  await sql`UPDATE posts SET views = views + 1 WHERE id = ${id}`;
}

export async function addComment(
  postId: number,
  user: { id: string; username: string },
  content: string,
) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO comments (post_id, user_id, author, content, status, created_at)
    VALUES (${postId}, ${user.id}, ${user.username}, ${content}, 'approved', NOW())
  `;
}

export async function listComments(postId: number, includeHidden = false) {
  if (!hasDatabase()) {
    return [];
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT comments.*, users.username
    FROM comments
    LEFT JOIN users ON comments.user_id = users.id::text
    WHERE comments.post_id = ${postId}
      AND (${includeHidden}::boolean OR status = 'approved')
    ORDER BY comments.created_at DESC
  `;

  return (rows as CommentRow[]).map(mapComment);
}

export async function deleteComment(id: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM comments WHERE id = ${id}`;
}

export async function listAllComments() {
  if (!hasDatabase()) {
    return [];
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT comments.*, users.username
    FROM comments
    LEFT JOIN users ON comments.user_id = users.id::text
    ORDER BY comments.created_at DESC
  `;

  return (rows as CommentRow[]).map(mapComment);
}

export async function listTags() {
  const counts = new Map<string, number>();

  for (const post of await listPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export async function getAdjacentPosts(post: Post) {
  const posts = await listPosts();
  const index = posts.findIndex((item) => item.id === post.id);

  return {
    previous: index >= 0 ? posts[index + 1] || null : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export async function getRelatedPosts(post: Post) {
  return (await listPosts({ limit: 8 }))
    .filter((item) => item.id !== post.id)
    .filter((item) => item.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
}

async function uniqueSlug(value: string, currentId?: number) {
  const base = slugify(value);
  let candidate = base;
  let index = 2;

  while (await slugExists(candidate, currentId)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

async function slugExists(slug: string, currentId?: number) {
  const sql = getSql();
  const rows = await sql`SELECT id FROM posts WHERE slug = ${slug} LIMIT 1`;
  const row = rows[0] as { id: number } | undefined;

  return Boolean(row && Number(row.id) !== currentId);
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

export function postPath(slug: string) {
  return `/posts/${encodeURIComponent(slug)}`;
}

export function decodeRouteSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function postSlugCandidates(slug: string) {
  const decoded = decodeRouteSlug(slug);
  const encoded = encodeURIComponent(decoded);
  const candidates = [...new Set([slug, decoded, encoded])];

  while (candidates.length < 3) {
    candidates.push(candidates[0]);
  }

  return candidates;
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
