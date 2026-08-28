import mammoth from "mammoth";

export async function extractWordText(data: Uint8Array): Promise<string> {
  const { value } = await mammoth.extractRawText({
    buffer: Buffer.from(data),
  });
  return value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
}
