import mammoth from "mammoth";
import puppeteer from "puppeteer";

export const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let browserPromise;
function getBrowser() {
  if (!browserPromise) browserPromise = puppeteer.launch({ headless: true });
  return browserPromise;
}

// Word doesn't have a document format Gemini natively understands, but PDF
// does. mammoth renders the docx's actual structure (headings, tables, lists)
// to HTML, then a headless Chrome prints that HTML to a real PDF — so
// grading tables and layout survive, not just a flattened text dump.
export async function convertDocxToPdf(buffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(
      `<html><body style="font-family: Helvetica, Arial, sans-serif; font-size: 13px; padding: 32px;">${html}</body></html>`,
      { waitUntil: "networkidle0" }
    );
    const pdf = await page.pdf({ format: "letter", printBackground: true });
    // Puppeteer returns a Uint8Array, not a Node Buffer — Uint8Array's own
    // toString("base64") silently ignores the encoding and dumps comma
    // separated decimal bytes instead, so wrap it before callers base64-encode it.
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
