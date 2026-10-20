import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PDF_PAGES = 5;

async function ocr(image: Blob | HTMLCanvasElement): Promise<string> {
  const worker = await createWorker("por");
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractPdf(file: File): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
  let text = "";
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  if (text.trim().length >= 50) return text;

  // PDF escaneado: reconhece o texto localmente.
  text = "";
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
    text += (await ocr(canvas)) + "\n";
  }
  return text;
}

export async function extractText(file: File): Promise<string> {
  return file.type === "application/pdf" ? extractPdf(file) : ocr(file);
}
