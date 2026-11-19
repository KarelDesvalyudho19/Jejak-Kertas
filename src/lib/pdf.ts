/** Hitung jumlah halaman PDF di peramban memakai pdf.js (dimuat saat dibutuhkan saja). */
export async function hitungHalamanPdf(file: File): Promise<number> {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const n = doc.numPages;
  await doc.destroy();
  return n;
}

/** Heuristik ringan: nama berkas yang tampak seperti berkas final. */
export function tampakFinal(namaFile: string) {
  return /final|sidang|pengesahan|hardcover|hard[\s_-]?cover|acc|jilid/i.test(namaFile);
}
