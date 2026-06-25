import { listPosts, postPath } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const posts = await listPosts();
  const items = posts
    .map(
      (post) => `
        <item>
          <title><![CDATA[${post.title}]]></title>
          <link>${siteUrl}${postPath(post.slug)}</link>
          <guid>${siteUrl}${postPath(post.slug)}</guid>
          <description><![CDATA[${post.excerpt}]]></description>
          <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
        </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>我的博客</title>
        <link>${siteUrl}</link>
        <description>一个自己掌控内容与数据的动态博客</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
