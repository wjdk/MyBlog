import type { ImportedPostInput } from "@/lib/posts";
import { put } from "@vercel/blob";
import { createHash } from "node:crypto";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

type ImageReference = {
  url: string;
  alt?: string;
};

export type ImportedImageResult = {
  posts: ImportedPostInput[];
  uploaded: number;
  failed: number;
  errors: string[];
};

export async function localizeImportedPostImages(
  posts: ImportedPostInput[],
): Promise<ImportedImageResult> {
  const urlCache = new Map<string, string>();
  const errors: string[] = [];
  let uploaded = 0;
  let failed = 0;

  const localizedPosts: ImportedPostInput[] = [];

  for (const post of posts) {
    const replacements = new Map<string, string>();
    const imageUrls = collectPostImageUrls(post).map((image) => image.url);

    for (const imageUrl of imageUrls) {
      if (urlCache.has(imageUrl)) {
        replacements.set(imageUrl, urlCache.get(imageUrl) || imageUrl);
        continue;
      }

      try {
        const blobUrl = await uploadRemoteImage(imageUrl, post.slug || post.title);
        urlCache.set(imageUrl, blobUrl);
        replacements.set(imageUrl, blobUrl);
        uploaded += 1;
      } catch (error) {
        failed += 1;
        errors.push(
          `${post.title || "未命名文章"} 的图片 ${imageUrl} 迁移失败：${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    }

    localizedPosts.push(replacePostImageUrls(post, replacements));
  }

  return {
    posts: localizedPosts,
    uploaded,
    failed,
    errors,
  };
}

function collectPostImageUrls(post: ImportedPostInput) {
  return [
    ...new Map(
      [
        ...(isImportableRemoteUrl(post.coverImage) ? [{ url: post.coverImage }] : []),
        ...extractImageUrls(post.content),
      ].map((image) => [image.url, image]),
    ).values(),
  ];
}

function extractImageUrls(content: string): ImageReference[] {
  const images: ImageReference[] = [];
  const markdownImagePattern = /!\[([^\]]*)]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const htmlImagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = markdownImagePattern.exec(content))) {
    if (isImportableRemoteUrl(match[2])) {
      images.push({ alt: match[1], url: match[2] });
    }
  }

  while ((match = htmlImagePattern.exec(content))) {
    if (isImportableRemoteUrl(match[1])) {
      images.push({ alt: altFromImageTag(match[0]), url: match[1] });
    }
  }

  return images;
}

function replacePostImageUrls(
  post: ImportedPostInput,
  replacements: Map<string, string>,
): ImportedPostInput {
  let content = post.content;

  for (const [sourceUrl, blobUrl] of replacements.entries()) {
    content = content.split(sourceUrl).join(blobUrl);
  }

  content = content.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, (tag, url) => {
    const alt = altFromImageTag(tag);
    return `![${alt}](${url})`;
  });

  return {
    ...post,
    coverImage: replacements.get(post.coverImage || "") || post.coverImage,
    content,
  };
}

async function uploadRemoteImage(imageUrl: string, postSlug: string) {
  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent": "MyBlog image importer",
    },
  });

  if (!response.ok) {
    throw new Error(`下载失败 HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error("图片超过 15 MB");
  }

  const contentType = normalizeImageContentType(response.headers.get("content-type"));
  if (!contentType) {
    throw new Error("远程资源不是可识别的图片");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("图片超过 15 MB");
  }

  const path = buildBlobPath(imageUrl, postSlug, contentType, bytes);
  const blob = await put(path, new Blob([bytes], { type: contentType }), {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  return blob.url;
}

function buildBlobPath(
  imageUrl: string,
  postSlug: string,
  contentType: string,
  bytes: ArrayBuffer,
) {
  const url = new URL(imageUrl);
  const originalName = decodeURIComponent(url.pathname.split("/").pop() || "");
  const extension = extensionFromName(originalName) || extensionFromContentType(contentType);
  const hash = createHash("sha256").update(Buffer.from(bytes)).digest("hex").slice(0, 12);
  const safeSlug = safePathSegment(postSlug || "post");
  const safeName = safePathSegment(originalName.replace(/\.[^.]+$/, "") || "image");

  return `blog/imports/${safeSlug}/${safeName}-${hash}.${extension}`;
}

function altFromImageTag(tag: string) {
  return tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "Image";
}

function normalizeImageContentType(value: string | null) {
  if (!value) {
    return "";
  }

  const contentType = value.split(";")[0].trim().toLowerCase();
  return contentType.startsWith("image/") ? contentType : "";
}

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  const extension = match?.[1] || "";
  return ["avif", "gif", "jpg", "jpeg", "png", "webp", "svg"].includes(extension)
    ? extension
    : "";
}

function extensionFromContentType(contentType: string) {
  const extension = contentType.split("/")[1] || "jpg";
  return extension === "jpeg" ? "jpg" : extension;
}

function safePathSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image"
  );
}

function isImportableRemoteUrl(value?: string) {
  if (!value || !/^https?:\/\//i.test(value)) {
    return false;
  }

  try {
    const { hostname } = new URL(value);
    return !hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
