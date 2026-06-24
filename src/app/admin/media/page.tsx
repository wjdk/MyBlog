import { uploadImageAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

type MediaPageProps = {
  searchParams: Promise<{ url?: string; error?: string }>;
};

export default async function MediaPage({ searchParams }: MediaPageProps) {
  await requireAdmin();
  const { url, error } = await searchParams;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin" className="text-sm font-medium text-[#2f6f73] hover:underline">
          返回后台
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">图片上传</h1>
        <form
          action={uploadImageAction}
          className="mt-8 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
        >
          {error ? <p className="text-sm text-red-700">请选择一张图片。</p> : null}
          <input
            required
            type="file"
            name="image"
            accept="image/*"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
          <button className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
            上传
          </button>
        </form>
        {url ? (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-sm font-medium text-stone-700">图片地址</p>
            <code className="mt-2 block rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-800">
              {url}
            </code>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="mt-4 max-h-80 rounded-lg object-contain" />
          </div>
        ) : null}
      </section>
    </main>
  );
}
