import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

export async function ensureSchema() {
  if (!hasDatabase()) {
    return;
  }

  if (!schemaReady) {
    schemaReady = createSchema();
  }

  await schemaReady;
}

async function createSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      category TEXT NOT NULL DEFAULT '随笔',
      tags TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      submission_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS submission_key TEXT`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS posts_submission_key_idx
    ON posts (submission_key)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const rows = await sql`SELECT COUNT(*)::int AS count FROM posts`;

  if (Number(rows[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO posts (
        title, slug, excerpt, content, status, category, tags, cover_image,
        views, likes, created_at, updated_at
      )
      VALUES (
        '第一篇博客：从这里开始',
        'first-post',
        '这是你的动态博客第一篇示例文章，可以在后台编辑或删除。',
        '## 欢迎来到你的博客

这个项目使用 Next.js 提供页面和后端接口，用 PostgreSQL 保存文章数据，用 Vercel Blob 保存图片。

- 可以新建、编辑、删除文章
- 支持分类、标签、封面图和 Markdown
- 支持评论、点赞、浏览量、搜索、RSS 和 Sitemap',
        'published',
        '项目记录',
        'Next.js,PostgreSQL,Vercel Blob,个人博客',
        '',
        0,
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}
