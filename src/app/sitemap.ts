import { listPosts, postPath } from "@/lib/posts";
import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPosts();

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
      url: `${siteUrl}${postPath(post.slug)}`,
      lastModified: new Date(post.updatedAt),
    })),
  ];
}
