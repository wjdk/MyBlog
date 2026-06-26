"use client";

import { type ChangeEvent, useRef } from "react";
import { useFormStatus } from "react-dom";

type FileSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  name: string;
  accept?: string;
  className?: string;
};

const defaultClassName =
  "inline-flex items-center justify-center rounded-md bg-[#0f58e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b4bd3] disabled:cursor-not-allowed disabled:bg-stone-400";

export function FileSubmitButton({
  label,
  pendingLabel = "处理中...",
  name,
  accept,
  className,
}: FileSubmitButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pending } = useFormStatus();

  function chooseFile() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  function submitAfterPick(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files?.length) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        required
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={submitAfterPick}
      />
      <button
        type="button"
        disabled={pending}
        className={className || defaultClassName}
        onClick={chooseFile}
      >
        {pending ? pendingLabel : label}
      </button>
    </>
  );
}
