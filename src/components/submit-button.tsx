"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
  className?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "处理中...",
  variant = "primary",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const defaultClassName =
    variant === "danger"
      ? "rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
      : "rounded-md bg-[#0f58e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b4bd3] disabled:cursor-not-allowed disabled:bg-stone-400";

  return (
    <button type="submit" disabled={pending} className={className || defaultClassName}>
      {pending ? pendingLabel : label}
    </button>
  );
}
