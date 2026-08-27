"use client";

import { useEffect, useMemo, useState } from "react";
import type { Finding } from "@/lib/types";

type EmailDraftModalProps = {
  open: boolean;
  findings: Finding[];
  focusId?: string | null;
  onClose: () => void;
};

function buildEmail(findings: Finding[], focusId?: string | null): string {
  const risks = findings
    .filter((finding) => finding.severity === "high" || finding.severity === "medium")
    .sort((a, b) => {
      if (a.id === focusId) return -1;
      if (b.id === focusId) return 1;
      return a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1;
    });

  if (risks.length === 0) {
    return `主旨：關於合作合約內容確認

您好：

謝謝您提供合約。為了讓後續合作與交付更順利，我想再確認付款、驗收及智慧財產權等執行細節，並建議將雙方共識補充於合約中。

若方便的話，希望能安排時間一起確認；謝謝您的理解與協助，期待順利展開合作。

敬祝 順心`;
  }

  const requests = risks
    .map(
      (finding, index) => `${index + 1}. ${finding.title}
考量：${finding.why}
建議文字：${finding.suggestion}`,
    )
    .join("\n\n");

  return `主旨：關於合作合約條款的幾點確認與調整建議

您好：

謝謝您提供合約，也很期待這次的合作。為了讓專案執行、驗收及後續權利使用都有清楚依據，我仔細確認後整理了幾點調整建議。這些內容主要是希望降低雙方認知落差，並不影響我方積極合作的意願：

${requests}

以上建議都是為了讓責任範圍、交付流程與權利義務更明確，避免日後因解讀不同影響專案進度。若貴方有既定版本或其他作法，我也很樂意一起討論並調整成雙方都能接受的文字。

再麻煩您協助確認，謝謝您的理解與配合，期待我們順利推進合作。

敬祝 順心`;
}

export function EmailDraftModal({
  open,
  findings,
  focusId,
  onClose,
}: EmailDraftModalProps) {
  const draft = useMemo(() => buildEmail(findings, focusId), [findings, focusId]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function copyDraft() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--ink)]/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-draft-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-2xl md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brass)]">
              談判武器
            </p>
            <h2 id="email-draft-title" className="mt-2 font-serif text-2xl">
              委婉修約信
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              已整合本次所有高、中風險項目；寄出前請依合作情境調整稱謂與內容。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
          >
            關閉
          </button>
        </div>

        <textarea
          readOnly
          value={draft}
          aria-label="修約信內容"
          className="mt-5 min-h-[420px] w-full resize-y rounded-xl border border-[var(--line)] bg-white/45 p-4 text-sm leading-7 outline-none"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void copyDraft()}
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)]"
          >
            {copied ? "已複製信件" : "一鍵複製完整信件"}
          </button>
        </div>
      </section>
    </div>
  );
}
