import { extractText, getDocumentProxy } from "unpdf";

const MAX_CHARS = 24_000;

export async function extractPdfText(data: Uint8Array): Promise<{
  text: string;
  pageCount: number;
}> {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;
  const normalized = merged.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  return {
    pageCount: totalPages,
    text: normalized.slice(0, MAX_CHARS),
  };
}
