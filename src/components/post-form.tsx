import type { Post } from "@/lib/posts";
import { SubmitButton } from "@/components/submit-button";

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  post?: Post;
  submitLabel: string;
  submissionKey?: string;
};

export function PostForm({
  action,
  post,
  submitLabel,
  submissionKey,
}: PostFormProps) {
  return (
    <form action={action} className="space-y-5">
      {submissionKey ? (
        <input type="hidden" name="submissionKey" value={submissionKey} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-stone-700">标题</span>
          <input
            required
            name="title"
            defaultValue={post?.title}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
            placeholder="写一个清楚的标题"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">链接别名</span>
          <input
            name="slug"
            defaultValue={post?.slug}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-950 outline-none focus:border-[#2f6f73]"
            placeholder="留空会自动生成"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">分类</span>
          <input
            name="category"
            defaultValue={post?.category || "随笔"}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
            placeholder="例如：技术、生活、项目记录"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">标签</span>
          <input
            name="tags"
            defaultValue={post?.tags.join(", ")}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
            placeholder="用逗号分隔，例如 Next.js, 随笔"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">封面图地址</span>
          <input
            name="coverImage"
            defaultValue={post?.coverImage}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
            placeholder="/uploads/cover.jpg 或 https://..."
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">摘要</span>
        <textarea
          required
          name="excerpt"
          defaultValue={post?.excerpt}
          rows={3}
          className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
          placeholder="首页展示的一小段简介"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">正文 Markdown</span>
        <textarea
          required
          name="content"
          defaultValue={post?.content}
          rows={16}
          className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm leading-7 text-stone-950 outline-none focus:border-[#2f6f73]"
          placeholder="支持标题、列表、引用、代码块和普通段落"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">状态</span>
        <select
          name="status"
          defaultValue={post?.status || "draft"}
          className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 outline-none focus:border-[#2f6f73]"
        >
          <option value="draft">草稿</option>
          <option value="published">发布</option>
        </select>
      </label>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
