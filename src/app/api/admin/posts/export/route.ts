import { isAdmin } from "@/lib/auth";
import { buildPostExport } from "@/lib/post-transfer";
import { listPosts } from "@/lib/posts";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exportFile = buildPostExport(await listPosts({ includeDrafts: true, limit: 1000 }));
  const body = JSON.stringify(exportFile, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="blog-posts-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
