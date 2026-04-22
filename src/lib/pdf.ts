// Lazy-load pdfjs to avoid pulling it into the initial bundle
let pdfjs: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (pdfjs) return pdfjs;
  const mod = await import('pdfjs-dist');
  // Use the CDN-hosted worker to avoid worker bundle hassles
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  mod.GlobalWorkerOptions.workerSrc = workerSrc;
  pdfjs = mod;
  return mod;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdf(file);
  }
  if (name.endsWith('.docx')) {
    return extractDocx(file);
  }
  return file.text();
}

async function extractPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const lib = await getPdfjs();
  const doc = await lib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ('str' in it ? (it as { str: string }).str : ''))
      .filter(Boolean)
      .join(' ');
    pages.push(text);
  }
  return pages.join('\n\n');
}

async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const mammoth = await import('mammoth/mammoth.browser');
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}
