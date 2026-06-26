"use server";

import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  importPosts,
  listPosts,
  postPath,
  splitTags,
  updatePost,
  type PostInput,
} from "@/lib/posts";
import {
  normalizeConflictStrategy,
  parsePostImportJson,
} from "@/lib/post-transfer";
import { localizeImportedPostImages } from "@/lib/post-image-import";
import {
  clearAdminSession,
  loginUser,
  registerUser,
  requireAdmin,
  requireUser,
  setUserSession,
} from "@/lib/auth";
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readPostForm(formData: FormData): PostInput {
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
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
    tags,
    coverImage,
    submissionKey: submissionKey || undefined,
  };
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const result = await loginUser(username, password);

  if (!result.ok) {
    redirect("/login?error=invalid");
  }

  await setUserSession(result.user);
  redirect(result.user.role === "admin" ? "/admin" : "/");
}

export async function registerAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = await registerUser(username, email, password);

  if (!result.ok) {
    redirect(`/login?mode=register&error=${result.error}`);
  }

  await setUserSession(result.user);
  redirect("/");
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

export async function importPostsAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get("postsFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import-export?error=file");
  }

  let target = "/admin/import-export";

  try {
    const posts = parsePostImportJson(await file.text());
    const result = await importPosts(
      posts,
      normalizeConflictStrategy(formData.get("conflictStrategy")),
    );
    const params = new URLSearchParams({
      created: String(result.created),
      updated: String(result.updated),
      skipped: String(result.skipped),
      failed: String(result.failed),
    });

    if (result.errors.length) {
      params.set("message", result.errors.slice(0, 3).join("；"));
    }

    revalidateAll();
    target = "/";
  } catch (error) {
    const message = error instanceof Error ? error.message : "导入失败";
    target = `/admin/import-export?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function importPostsWithImagesAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get("postsFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import-export?error=file");
  }

  let target = "/admin/import-export";

  try {
    let posts = parsePostImportJson(await file.text());
    let imagesUploaded = 0;
    let imagesFailed = 0;
    const imageErrors: string[] = [];

    if (formData.get("localizeImages") === "on") {
      const imageResult = await localizeImportedPostImages(posts);
      posts = imageResult.posts;
      imagesUploaded = imageResult.uploaded;
      imagesFailed = imageResult.failed;
      imageErrors.push(...imageResult.errors);
    }

    const result = await importPosts(
      posts,
      normalizeConflictStrategy(formData.get("conflictStrategy")),
    );
    const params = new URLSearchParams({
      created: String(result.created),
      updated: String(result.updated),
      skipped: String(result.skipped),
      failed: String(result.failed),
      imagesUploaded: String(imagesUploaded),
      imagesFailed: String(imagesFailed),
    });

    const errors = [...imageErrors, ...result.errors];
    if (errors.length) {
      params.set("message", errors.slice(0, 3).join("；"));
    }

    revalidateAll();
    target = "/";
  } catch (error) {
    const message = error instanceof Error ? error.message : "导入失败";
    target = `/admin/import-export?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function localizeExistingPostImagesAction() {
  await requireAdmin();

  let target = "/admin/import-export";

  try {
    const posts = await listPosts({ includeDrafts: true, limit: 1000 });
    const imageResult = await localizeImportedPostImages(
      posts.map((post) => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        tags: post.tags,
        coverImage: post.coverImage,
        views: post.views,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
    );
    let updatedPosts = 0;

    for (const [index, localizedPost] of imageResult.posts.entries()) {
      const originalPost = posts[index];

      if (
        originalPost &&
        (localizedPost.content !== originalPost.content ||
          localizedPost.coverImage !== originalPost.coverImage)
      ) {
        await updatePost(originalPost.id, localizedPost);
        updatedPosts += 1;
      }
    }

    const params = new URLSearchParams({
      syncedPosts: String(updatedPosts),
      imagesUploaded: String(imageResult.uploaded),
      imagesFailed: String(imageResult.failed),
    });

    if (imageResult.errors.length) {
      params.set("message", imageResult.errors.slice(0, 3).join("；"));
    }

    revalidateAll();
    target = "/";
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片同步失败";
    target = `/admin/import-export?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function addCommentAction(
  postId: number,
  slug: string,
  formData: FormData,
) {
  const user = await requireUser();
  const content = String(formData.get("content") || "").trim();
  const parentId = Number(formData.get("parentId") || 0);
  const submissionKey = String(formData.get("submissionKey") || "").trim();

  if (content) {
    await addComment(
      postId,
      user,
      content.slice(0, 800),
      Number.isSafeInteger(parentId) && parentId > 0 ? parentId : null,
      submissionKey || null,
    );
  }

  revalidatePath(postPath(slug));
  redirect(`${postPath(slug)}#${parentId > 0 ? `comment-${parentId}` : "comments"}`);
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

export async function replaceImageAction(pathname: string, formData: FormData) {
  await requireAdmin();

  if (!pathname.startsWith("blog/")) {
    redirect("/admin/media?error=replace-scope");
  }

  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=replace-file");
  }

  let blob: Awaited<ReturnType<typeof put>>;

  try {
    blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: file.type || undefined,
    });
  } catch {
    redirect("/admin/media?error=replace");
  }

  revalidatePath("/admin/media");
  redirect(`/admin/media?replaced=1&url=${encodeURIComponent(blob.url)}`);
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
