import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dataDir = path.join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });

    db = new Database(path.join(dataDir, "blog.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved',
        created_at TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      );
    `);

    ensurePostColumns(db);
    seedIfEmpty(db);
  }

  return db;
}

function ensurePostColumns(database: Database.Database) {
  const columns = database
    .prepare("PRAGMA table_info(posts)")
    .all() as { name: string }[];
  const names = new Set(columns.map((column) => column.name));

  const additions = [
    ["category", "TEXT NOT NULL DEFAULT '随笔'"],
    ["tags", "TEXT NOT NULL DEFAULT ''"],
    ["cover_image", "TEXT NOT NULL DEFAULT ''"],
    ["views", "INTEGER NOT NULL DEFAULT 0"],
    ["likes", "INTEGER NOT NULL DEFAULT 0"],
  ] as const;

  for (const [name, definition] of additions) {
    if (!names.has(name)) {
      database.exec(`ALTER TABLE posts ADD COLUMN ${name} ${definition}`);
    }
  }
}

function seedIfEmpty(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM posts").get() as {
    count: number;
  };

  if (count.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO posts (
        title, slug, excerpt, content, status, category, tags, cover_image,
        views, likes, created_at, updated_at
      )
       VALUES (
        @title, @slug, @excerpt, @content, @status, @category, @tags,
        @coverImage, @views, @likes, @createdAt, @updatedAt
      )`,
    )
    .run({
      title: "第一篇博客：从这里开始",
      slug: "first-post",
      excerpt: "这是你的动态博客第一篇示例文章，可以在后台编辑或删除。",
      content:
        "## 欢迎来到你的博客\n\n这个项目使用 Next.js 提供页面和后端接口，用 SQLite 保存文章数据。\n\n- 可以新建、编辑、删除文章\n- 支持分类、标签、封面图和 Markdown\n- 支持评论、点赞、浏览量、搜索、RSS 和 Sitemap\n\n下一步可以把后台登录接入更完整的账号系统。",
      status: "published",
      category: "项目记录",
      tags: "Next.js,SQLite,个人博客",
      coverImage: "",
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    });
}
