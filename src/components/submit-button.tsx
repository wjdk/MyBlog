"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "保存中...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[#2f6f73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25595c] disabled:cursor-not-allowed disabled:bg-stone-400"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
