import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/extract-pdf";
import { extractWordText } from "@/lib/extract-word";
import { freeReviewCookieHeader, hasPaidAccess, hasUsedFreeReview } from "@/lib/quota";
import { runContractReview } from "@/lib/run-review";
import {
  SAMPLE_CONTRACT_NAME,
  SAMPLE_CONTRACT_TEXT,
} from "@/lib/sample-contract";
import type { ReviewResult } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 24_000;

function previewResult(result: ReviewResult): ReviewResult {
  return {
    ...result,
    access: "preview",
    findings: result.findings.map((finding) => ({
      id: finding.id,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      verdict: finding.verdict,
      ...(finding.ruleId ? { ruleId: finding.ruleId } : {}),
    })),
  };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "請使用 multipart/form-data 上傳檔案或合約文字。" },
      { status: 415 },
    );
  }
  const isSample = formData.get("sample") === "1";
  const pastedText = formData.get("text");
  const textInput = typeof pastedText === "string" ? pastedText.trim() : "";
  const hasPastedText = textInput.length > 0;

  const paid = await hasPaidAccess();
  if (!isSample && (await hasUsedFreeReview()) && !paid) {
    return NextResponse.json(
      {
        code: "quota_exceeded",
        message: "免費審閱額度已用完",
      },
      { status: 402 },
    );
  }

  let pageCount = 1;
  let text = "";
  let fileName = SAMPLE_CONTRACT_NAME;

  if (isSample) {
    text = SAMPLE_CONTRACT_TEXT;
  } else if (hasPastedText) {
    text = textInput;
    fileName = "貼上的合約文字";
  } else {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "請上傳 PDF 檔案。" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "檔案請小於 10MB。" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const isPdf =
      file.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx");
    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "目前支援 PDF 與 Word .docx；舊版 .doc 請先另存為 .docx。" },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    try {
      if (isPdf) {
        const extracted = await extractPdfText(bytes);
        pageCount = extracted.pageCount;
        text = extracted.text;
      } else {
        text = await extractWordText(bytes);
        pageCount = 1;
      }
      fileName = file.name;
    } catch {
      return NextResponse.json(
        { error: "讀不到檔案內容。PDF 請使用可選取文字版本；Word 請使用 .docx。" },
        { status: 400 },
      );
    }
  }

  if (text.replace(/\s/g, "").length < 80) {
    return NextResponse.json(
      {
        error:
          "合約文字太少，無法判讀。請貼上完整內容，或提供可選取文字的 PDF / .docx。",
      },
      { status: 400 },
    );
  }

  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      {
        error: `合約內容超過 ${MAX_TEXT_CHARS.toLocaleString()} 字，為避免只分析到前半段，請拆成數份後分別檢查。`,
      },
      { status: 400 },
    );
  }

  const fullResult = await runContractReview({
    text,
    pageCount,
    fileName,
    preferRulesOnly: isSample,
  });

  const result = isSample || paid ? fullResult : previewResult(fullResult);
  const response = NextResponse.json(result);
  if (!isSample && !paid) {
    response.headers.append("Set-Cookie", freeReviewCookieHeader());
  }
  return response;
}
