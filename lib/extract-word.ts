import mammoth from "mammoth";

const MAX_CHARS = 24_000;

export async function extractWordText(data: Uint8Array): Promise<string> {
  const { value } = await mammoth.extractRawText({
    buffer: Buffer.from(data),
  });
  return value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim().slice(0, MAX_CHARS);
}
