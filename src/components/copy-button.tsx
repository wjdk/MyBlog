"use client";

import { useState, useTransition } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "复制地址" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function copyValue() {
    startTransition(async () => {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      disabled={isPending}
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:text-stone-400"
    >
      {copied ? "已复制" : label}
    </button>
  );
}
