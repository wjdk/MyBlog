# Vercel 部署说明

本项目已经改为：

- PostgreSQL：保存文章、评论、分类、标签、浏览量、点赞数和图片 URL
- Vercel Blob：保存后台上传的图片文件
- Next.js：页面、后台和 API

## 1. 在 Vercel 创建项目

把 GitHub 仓库 `wjdk/MyBlog` 导入 Vercel。

Framework 选择 Next.js，其他保持默认即可。

## 2. 创建数据库

在 Vercel Marketplace 添加 Neon Postgres，连接到这个项目。

连接后确认项目环境变量里有：

```env
DATABASE_URL=...
```

项目首次访问时会自动建表，并创建一篇示例文章。

## 3. 创建 Blob 存储

在 Vercel Storage 创建 Blob Store，连接到这个项目。

连接后确认项目环境变量里有：

```env
BLOB_READ_WRITE_TOKEN=...
```

后台上传图片时会把文件上传到 Vercel Blob，并返回一个公开 URL。

## 4. 设置博客环境变量

在 Vercel Project Settings -> Environment Variables 里添加：

```env
ADMIN_PASSWORD=换成你的后台密码
NEXT_PUBLIC_SITE_URL=https://你的-vercel-域名
```

如果绑定了自定义域名，把 `NEXT_PUBLIC_SITE_URL` 改成正式域名。

## 5. 本地验证

如果你要在本地连线上数据库，需要先从 Vercel 拉环境变量：

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local
npm install
npm run build
```

## 6. 部署

如果使用 GitHub 集成，推送到 GitHub 后 Vercel 会自动部署：

```bash
git push origin master
```

也可以用 CLI 手动部署：

```bash
npx vercel --prod
```

## 7. 上线后检查

- 首页：`/`
- 后台登录：`/login`
- 后台管理：`/admin`
- 图片上传：`/admin/media`
- RSS：`/rss.xml`
- Sitemap：`/sitemap.xml`

默认本地后备密码是 `admin123`。正式部署一定要设置 `ADMIN_PASSWORD`。
