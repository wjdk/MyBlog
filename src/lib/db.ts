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
      tags TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      user_id TEXT,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id TEXT`;
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'comments_parent_id_fkey'
      ) THEN
        ALTER TABLE comments
        ADD CONSTRAINT comments_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS comments_parent_id_idx
    ON comments (parent_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx
    ON sessions (user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx
    ON sessions (expires_at)
  `;

  const rows = await sql`SELECT COUNT(*)::int AS count FROM posts`;

  if (Number(rows[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO posts (
        title, slug, excerpt, content, status, tags, cover_image,
        views, created_at, updated_at
      )
      VALUES (
        '第一篇博客：从这里开始',
        'first-post',
        '这是你的动态博客第一篇示例文章，可以在后台编辑或删除。',
        '## 欢迎来到你的博客

这个项目使用 Next.js 提供页面和后端接口，用 PostgreSQL 保存文章数据，用 Vercel Blob 保存图片。

- 可以新建、编辑、删除文章
- 支持标签、封面图和 Markdown
- 支持评论、浏览量、搜索、RSS 和 Sitemap',
        'published',
        'Next.js,PostgreSQL,Vercel Blob,个人博客',
        '',
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}
