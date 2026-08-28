"use client";

import { useCallback, useEffect, useState } from "react";
import { FindingsPanel } from "@/components/FindingsPanel";
import { PdfPreview } from "@/components/PdfPreview";
import { UpgradeGate } from "@/components/UpgradeGate";
import { SAMPLE_CONTRACT_NAME, SAMPLE_CONTRACT_TEXT } from "@/lib/sample-contract";
import type { ReviewResult } from "@/lib/types";

type InputMode = "file" | "text";

export function ReviewApp({ initialQuotaUsed }: { initialQuotaUsed: boolean }) {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState("");
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
    setContractText("");
    setResult(null);
    setError(null);
  }, []);

  function switchMode(nextMode: InputMode) {
    setMode(nextMode);
    setResult(null);
    setError(null);
  }

  async function submitReview() {
    if (quotaUsed) return;
    if (mode === "file" && !file) return;
    if (mode === "text" && contractText.replace(/\s/g, "").length < 80) {
      setError("文字太少。請貼上完整合約，至少 80 個字。");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      if (mode === "file" && file) body.set("file", file);
      if (mode === "text") body.set("text", contractText);

      const response = await fetch("/api/review", { method: "POST", body });
      const data = await response.json();
      if (response.status === 402) {
        setQuotaUsed(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "分析失敗，請再試一次。");

      setResult(data as ReviewResult);
      setQuotaUsed(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失敗，請再試一次。");
    } finally {
      setLoading(false);
    }
  }

  async function reviewSample() {
    setMode("text");
    setFile(null);
    setContractText(SAMPLE_CONTRACT_TEXT);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      body.set("sample", "1");
      const response = await fetch("/api/review", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "範本分析失敗，請再試一次。");
      setResult(data as ReviewResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "範本分析失敗，請再試一次。");
    } finally {
      setLoading(false);
    }
  }

  const isPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false;
  const showWorkspace = Boolean(file || contractText);
  const canSubmit =
    !quotaUsed &&
    !loading &&
    (mode === "file" ? Boolean(file) : contractText.replace(/\s/g, "").length >= 80);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 pt-5 dark:border-zinc-800 md:px-7">
          <div
            role="tablist"
            aria-label="合約輸入方式"
            className="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-900"
          >
            {[
              ["file", "上傳 PDF / Word"],
              ["text", "直接貼上合約文字"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value as InputMode)}
                className={`rounded-md px-4 py-2 font-medium transition ${
                  mode === value
                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="py-4 text-xs text-zinc-500">
            每月免費分析 1 份，踩雷範本不扣額度。檔案只用於這次分析。
          </p>
        </div>

        <div className="p-5 md:p-7">
          {mode === "file" ? (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                onFile(event.dataTransfer.files[0] ?? null);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition ${
                dragging
                  ? "border-zinc-950 bg-zinc-50 dark:border-white dark:bg-zinc-900"
                  : "border-zinc-300 bg-zinc-50/60 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40"
              }`}
            >
              <input
                type="file"
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-lg dark:border-zinc-700 dark:bg-zinc-900">
                ↑
              </span>
              <span className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                拖進來，或點這裡選檔
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                PDF、Word .docx · 上限 10MB
              </span>
              {file ? (
                <span className="mt-4 rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {file.name}
                </span>
              ) : null}
            </label>
          ) : (
            <div>
              <textarea
                value={contractText}
                onChange={(event) => {
                  setContractText(event.target.value);
                  setResult(null);
                  setError(null);
                }}
                placeholder="把合約全文貼在這裡。付款、驗收、修改次數、競業與著作權條款都別漏掉。"
                className="min-h-72 w-full resize-y rounded-xl border border-zinc-300 bg-white p-4 text-sm leading-7 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
              <p className="mt-2 text-right text-xs text-zinc-400">
                {contractText.length.toLocaleString()} 字
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void submitReview()}
              className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {loading ? "正在拆合約…" : quotaUsed ? "本月免費額度已用完" : "開始抓雷"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void reviewSample()}
              className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              點我載入真實接案踩雷範本
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      {quotaUsed && !result ? <UpgradeGate /> : null}

      {showWorkspace ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-h-[480px] rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            {file && isPdf ? (
              <PdfPreview file={file} />
            ) : file ? (
              <div className="grid min-h-[448px] place-items-center rounded-xl bg-zinc-50 p-8 text-center dark:bg-zinc-900">
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Word 內容已送往分析。為避免版面誤導，這裡不模擬原文件排版。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[448px] flex-col">
                <p className="mb-3 text-xs font-medium text-zinc-500">
                  {contractText === SAMPLE_CONTRACT_TEXT
                    ? SAMPLE_CONTRACT_NAME
                    : "貼上的合約文字"}
                </p>
                <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 font-sans text-sm leading-7 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {contractText}
                </pre>
              </div>
            )}
          </div>
          <div>
            {result ? (
              <FindingsPanel result={result} />
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                {loading ? "正在拆條款，馬上好。" : "分析結果會出現在這裡。"}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
