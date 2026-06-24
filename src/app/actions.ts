"use server";

import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  likePost,
  splitTags,
  updatePost,
  type PostInput,
} from "@/lib/posts";
import {
  clearAdminSession,
  getAdminPassword,
  requireAdmin,
  setAdminSession,
} from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readPostForm(formData: FormData): PostInput {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const category = String(formData.get("category") || "随笔").trim();
  const coverImage = String(formData.get("coverImage") || "").trim();
  const tags = splitTags(String(formData.get("tags") || ""));
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title || !excerpt || !content) {
    throw new Error("标题、摘要和正文都不能为空。");
  }

  return {
    title,
    slug,
    excerpt,
    content,
    status,
    category: category || "随笔",
    tags,
    coverImage,
  };
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (password !== getAdminPassword()) {
    redirect("/login?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/");
}

export async function createPostAction(formData: FormData) {
  await requireAdmin();
  const post = createPost(readPostForm(formData));

  revalidateAll();
  redirect(post?.status === "published" ? `/posts/${post.slug}` : "/admin");
}

export async function updatePostAction(id: number, formData: FormData) {
  await requireAdmin();
  const post = updatePost(id, readPostForm(formData));

  revalidateAll();

  if (!post) {
    redirect("/admin");
  }

  redirect(post.status === "published" ? `/posts/${post.slug}` : "/admin");
}

export async function deletePostAction(id: number) {
  await requireAdmin();
  deletePost(id);

  revalidateAll();
  redirect("/admin");
}

export async function addCommentAction(postId: number, slug: string, formData: FormData) {
  const author = String(formData.get("author") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (author && content) {
    addComment(postId, author.slice(0, 40), content.slice(0, 800));
  }

  revalidatePath(`/posts/${slug}`);
  redirect(`/posts/${slug}#comments`);
}

export async function likePostAction(postId: number, slug: string) {
  likePost(postId);
  revalidatePath(`/posts/${slug}`);
  redirect(`/posts/${slug}`);
}

export async function deleteCommentAction(commentId: number) {
  await requireAdmin();
  deleteComment(commentId);

  revalidatePath("/admin/comments");
  redirect("/admin/comments");
}

export async function uploadImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=1");
  }

  const extension = path.extname(file.name).toLowerCase() || ".jpg";
  const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));

  redirect(`/admin/media?url=${encodeURIComponent(`/uploads/${safeName}`)}`);
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
}
