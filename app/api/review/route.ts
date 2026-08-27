import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/extract-pdf";
import { freeReviewCookieHeader, hasUsedFreeReview } from "@/lib/quota";
import { runContractReview } from "@/lib/run-review";
import {
  SAMPLE_CONTRACT_NAME,
  SAMPLE_CONTRACT_TEXT,
} from "@/lib/sample-contract";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const isSample = formData.get("sample") === "1";

  if (!isSample && (await hasUsedFreeReview())) {
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
  } else {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "請上傳 PDF 檔案。" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "檔案請小於 10MB。" }, { status: 400 });
    }

    const typeOk =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!typeOk) {
      return NextResponse.json({ error: "僅支援 PDF。" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    try {
      const extracted = await extractPdfText(bytes);
      pageCount = extracted.pageCount;
      text = extracted.text;
      fileName = file.name;
    } catch {
      return NextResponse.json(
        { error: "無法讀取這份 PDF，請改用可選取文字的檔案。" },
        { status: 400 },
      );
    }
  }

  if (text.replace(/\s/g, "").length < 80) {
    return NextResponse.json(
      {
        error:
          "抽到的文字過少（可能是掃描件或圖片 PDF）。請提供可複製文字的合約檔。",
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
  if (!isSample) {
    response.headers.append("Set-Cookie", freeReviewCookieHeader());
  }
  return response;
}
