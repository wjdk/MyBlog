import { createPost, listPosts, splitTags } from "@/lib/posts";
import { isAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ posts: await listPosts({ includeDrafts: true }) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const post = await createPost({
    title: String(body.title || ""),
    slug: String(body.slug || ""),
    excerpt: String(body.excerpt || ""),
    content: String(body.content || ""),
    tags: Array.isArray(body.tags) ? body.tags : splitTags(String(body.tags || "")),
    coverImage: String(body.coverImage || ""),
    status: body.status === "published" ? "published" : "draft",
  });

  return NextResponse.json({ post }, { status: 201 });
}
