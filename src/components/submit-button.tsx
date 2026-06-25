"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
};

export function SubmitButton({
  label,
  pendingLabel = "保存中...",
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const className =
    variant === "danger"
      ? "rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
      : "rounded-md bg-[#2f6f73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25595c] disabled:cursor-not-allowed disabled:bg-stone-400";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
