"use client";

import { useEffect, useRef, useState } from "react";

type PdfPreviewProps = {
  file: File;
};

export function PdfPreview({ file }: PdfPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    setError(null);

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data, enableXfa: false }).promise;
      if (cancelled) return;
      setPages(pdf.numPages);

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.15 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "mb-3 w-full rounded-sm bg-white shadow-sm";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `PDF 第 ${pageNumber} 頁預覽`);
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        host.appendChild(canvas);
      }
    })().catch(() => {
      if (!cancelled) setError("PDF 預覽失敗，仍可嘗試送出初審。");
    });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-3 text-xs text-zinc-500">
        <span>{file.name}</span>
        {pages > 0 ? <span>{pages} 頁</span> : null}
      </div>
      {error ? <p className="mb-3 text-sm text-amber-800">{error}</p> : null}
      <div
        ref={hostRef}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-900"
      />
    </div>
  );
}
