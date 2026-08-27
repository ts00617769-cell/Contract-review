"use client";

import { useCallback, useEffect, useState } from "react";
import { FindingsPanel } from "@/components/FindingsPanel";
import { PdfPreview } from "@/components/PdfPreview";
import { UpgradeGate } from "@/components/UpgradeGate";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";
import type { ReviewResult } from "@/lib/types";

export function ReviewApp({ initialQuotaUsed }: { initialQuotaUsed: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(initialQuotaUsed);

  useEffect(() => {
    fetch("/api/quota")
      .then((response) => response.json())
      .then((data: { used?: boolean }) => setQuotaUsed(Boolean(data.used)))
      .catch(() => undefined);
  }, []);

  const onFile = useCallback((next: File | null) => {
    if (!next) return;
    setFile(next);
    setResult(null);
    setError(null);
  }, []);

  async function review() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/review", { method: "POST", body });
      const data = await response.json();
      if (response.status === 402) {
        setQuotaUsed(true);
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "初審失敗");
      }
      setResult(data as ReviewResult);
      setQuotaUsed(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "初審失敗");
    } finally {
      setLoading(false);
    }
  }

  if (quotaUsed && !result) {
    return <UpgradeGate />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--brass)]">
              免費額度 1 份合約
            </p>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl">上傳 PDF，標出高風險條款</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              針對台灣接案設計師與行銷顧問：不對等條款、模糊付款、智財轉讓陷阱，並給出可談判的修改建議。
            </p>
          </div>
          <p className="max-w-xs text-xs leading-5 text-[var(--muted)]">{DISCLAIMER_SHORT}</p>
        </div>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files[0];
            if (dropped) onFile(dropped);
          }}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 transition ${
            dragging
              ? "border-[var(--brass)] bg-[var(--wash)]"
              : "border-[var(--line)] bg-[var(--wash)]/60"
          }`}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
          <span className="font-serif text-lg">把合約 PDF 拖到這裡</span>
          <span className="mt-2 text-sm text-[var(--muted)]">或點擊選取 · 上限 10MB · 需為可選文字檔</span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!file || loading}
            onClick={() => void review()}
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-40"
          >
            {loading ? "哨兵閱讀中…" : "開始初審"}
          </button>
          {file ? (
            <span className="text-sm text-[var(--muted)]">{file.name}</span>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
      </section>

      {file ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="min-h-[480px] rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <PdfPreview file={file} />
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-transparent">
            {result ? (
              <FindingsPanel result={result} />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                預覽確認後按「開始初審」。標註會出現在這裡。
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
