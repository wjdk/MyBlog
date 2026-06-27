"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

type FileSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  name: string;
  accept?: string;
  className?: string;
  variant?: "button" | "dropzone";
  dropLabel?: string;
  dropHint?: string;
};

const defaultClassName =
  "inline-flex items-center justify-center rounded-md bg-[#0f58e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b4bd3] disabled:cursor-not-allowed disabled:bg-stone-400";

export function FileSubmitButton({
  label,
  pendingLabel = "处理中...",
  name,
  accept,
  className,
  variant = "button",
  dropLabel = "拖拽文件到此处上传",
  dropHint,
}: FileSubmitButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pending } = useFormStatus();
  const [isDragging, setIsDragging] = useState(false);

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

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    if (pending) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (pending || !inputRef.current) {
      return;
    }

    const file = event.dataTransfer.files.item(0);

    if (!file || !matchesAccept(file, accept)) {
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    inputRef.current.form?.requestSubmit();
  }

  if (variant === "dropzone") {
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
          className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition disabled:cursor-not-allowed ${
            isDragging
              ? "border-[#2f6f73] bg-[#2f6f73]/10"
              : "border-stone-300 bg-stone-50 hover:border-[#2f6f73] hover:bg-white"
          }`}
          onClick={chooseFile}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="text-sm font-semibold text-stone-950">
            {pending ? pendingLabel : dropLabel}
          </span>
          {dropHint ? <span className="mt-2 text-xs text-stone-500">{dropHint}</span> : null}
          <span className="mt-4 inline-flex rounded-md bg-[#0f58e8] px-4 py-2 text-sm font-semibold text-white">
            {pending ? pendingLabel : label}
          </span>
        </button>
      </>
    );
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

function matchesAccept(file: File, accept?: string) {
  if (!accept) {
    return true;
  }

  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      if (rule.endsWith("/*")) {
        return fileType.startsWith(rule.slice(0, -1));
      }

      if (rule.startsWith(".")) {
        return fileName.endsWith(rule);
      }

      return fileType === rule;
    });
}
