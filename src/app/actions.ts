"use server";

import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  postPath,
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
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readPostForm(formData: FormData): PostInput {
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const category = String(formData.get("category") || "随笔").trim();
  const coverImage = String(formData.get("coverImage") || "").trim();
  const tags = splitTags(String(formData.get("tags") || ""));
  const status = formData.get("status") === "published" ? "published" : "draft";
  const submissionKey = String(formData.get("submissionKey") || "").trim();

  if (!title || !content) {
    throw new Error("标题和正文都不能为空。");
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
    submissionKey: submissionKey || undefined,
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
  const post = await createPost(readPostForm(formData));

  revalidateAll();
  if (post?.status === "published") {
    revalidatePath(postPath(post.slug));
    redirect("/");
  }

  redirect("/admin");
}

export async function updatePostAction(id: number, formData: FormData) {
  await requireAdmin();
  const post = await updatePost(id, readPostForm(formData));

  revalidateAll();

  if (!post) {
    redirect("/admin");
  }

  if (post.status === "published") {
    revalidatePath(postPath(post.slug));
    redirect("/");
  }

  redirect("/admin");
}

export async function deletePostAction(id: number) {
  await requireAdmin();
  await deletePost(id);

  revalidateAll();
  redirect("/admin");
}

export async function addCommentAction(
  postId: number,
  slug: string,
  formData: FormData,
) {
  const author = String(formData.get("author") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (author && content) {
    await addComment(postId, author.slice(0, 40), content.slice(0, 800));
  }

  revalidatePath(postPath(slug));
  redirect(`${postPath(slug)}#comments`);
}

export async function deleteCommentAction(commentId: number) {
  await requireAdmin();
  await deleteComment(commentId);

  revalidatePath("/admin/comments");
  redirect("/admin/comments");
}

export async function uploadImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=1");
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "-").toLowerCase();
  let blob: Awaited<ReturnType<typeof put>>;

  try {
    blob = await put(`blog/${Date.now()}-${safeName}`, file, {
      access: "public",
    });
  } catch {
    redirect("/admin/media?error=upload");
  }

  redirect(`/admin/media?url=${encodeURIComponent(blob.url)}`);
}

export async function deleteImageAction(pathname: string) {
  await requireAdmin();

  if (!pathname.startsWith("blog/")) {
    redirect("/admin/media?error=delete-scope");
  }

  try {
    await del(pathname);
  } catch {
    redirect("/admin/media?error=delete");
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
}
