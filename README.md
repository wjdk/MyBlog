# 池鱼手记

一个用 Next.js 搭建的个人博客项目，用来收录开发笔记、学习记录、生活日常和绘画内容。项目包含前台阅读体验、文章归档、标签检索、评论展示，以及一个轻量后台用于管理文章和媒体资源。

## 项目亮点

- 前台首页展示最新文章、站点统计和标签入口。
- 支持文章详情页、归档页、标签页、搜索页、RSS 和 Sitemap。
- 后台支持文章创建、编辑、评论管理、媒体上传，以及文章导入导出。
- 文章内容支持 Markdown 渲染，适合记录长文、代码片段和图文内容。
- 数据可接入 Neon Postgres，图片资源可接入 Vercel Blob。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Neon Postgres
- Vercel Blob

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000) 查看页面。

常用命令：

```bash
npm run build
npm run start
npm run lint
npm run typecheck
```

## 环境变量

本地开发或部署时可按需配置：

```env
DATABASE_URL=你的 Neon Postgres 连接地址
BLOB_READ_WRITE_TOKEN=你的 Vercel Blob 读写令牌
ADMIN_PASSWORD=后台登录密码
NEXT_PUBLIC_SITE_URL=https://你的站点域名
```

如果不连接线上数据库，项目仍可作为普通 Next.js 应用阅读和开发；正式部署时建议配置完整环境变量。

## 目录结构

```text
src/app                 页面、路由和服务端 action
src/components          复用 UI 组件
src/lib                 数据、鉴权、文章和媒体处理逻辑
public                  静态资源
data                    本地数据相关文件
```

## 部署

项目适合部署到 Vercel。将仓库导入 Vercel 后，配置 Neon Postgres、Vercel Blob 和上方环境变量即可。更完整的部署步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 项目状态

这是一个持续迭代中的个人博客项目。界面和功能会围绕真实写作、归档、图片管理和长期维护体验继续优化。
