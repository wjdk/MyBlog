import { listPosts } from "@/lib/posts";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const posts = listPosts();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date(),
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updatedAt),
    })),
  ];
}
