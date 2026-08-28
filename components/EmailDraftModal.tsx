"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildEmail } from "@/lib/email-draft";
import type { Finding } from "@/lib/types";

type EmailDraftModalProps = {
  open: boolean;
  findings: Finding[];
  focusId?: string | null;
  allowDownload?: boolean;
  onClose: () => void;
};

export function EmailDraftModal({
  open,
  findings,
  focusId,
  allowDownload = false,
  onClose,
}: EmailDraftModalProps) {
  const draft = useMemo(() => buildEmail(findings, focusId), [findings, focusId]);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function copyDraft() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  function downloadDraft() {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "修約信.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-draft-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Negotiation draft
            </p>
            <h2 id="email-draft-title" className="mt-2 text-2xl font-semibold tracking-tight">
              不撕破臉的修約信
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              紅黃項目都整理好了。寄出前把稱謂和專案名稱換掉。
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            關閉
          </button>
        </div>

        <textarea
          readOnly
          value={draft}
          aria-label="修約信內容"
          className="mt-5 min-h-[420px] w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 p-4 text-sm leading-7 text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {allowDownload ? (
            <button
              type="button"
              onClick={downloadDraft}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              下載修約信
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void copyDraft()}
            className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            {copied ? "已複製信件" : "一鍵複製完整信件"}
          </button>
        </div>
      </section>
    </div>
  );
}
