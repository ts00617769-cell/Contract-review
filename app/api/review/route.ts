import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/extract-pdf";
import { extractWordText } from "@/lib/extract-word";
import { freeReviewCookieHeader, hasPaidAccess, hasUsedFreeReview } from "@/lib/quota";
import { runContractReview } from "@/lib/run-review";
import {
  SAMPLE_CONTRACT_NAME,
  SAMPLE_CONTRACT_TEXT,
} from "@/lib/sample-contract";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 24_000;

export async function POST(request: Request) {
  const formData = await request.formData();
  const isSample = formData.get("sample") === "1";
  const pastedText = formData.get("text");
  const textInput = typeof pastedText === "string" ? pastedText.trim() : "";
  const hasPastedText = textInput.length > 0;

  if (!isSample && (await hasUsedFreeReview()) && !(await hasPaidAccess())) {
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
    text = textInput.slice(0, MAX_TEXT_CHARS);
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

  const result = await runContractReview({
    text,
    pageCount,
    fileName,
    preferRulesOnly: isSample,
  });

  const response = NextResponse.json(result);
  if (!isSample && !(await hasPaidAccess())) {
    response.headers.append("Set-Cookie", freeReviewCookieHeader());
  }
  return response;
}
