"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfReaderProps = { url: string; title: string };

export default function PdfReader({ url, title }: PdfReaderProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    let cancelled = false;
    const loadingTask = pdfjs.getDocument({ url, disableAutoFetch: false, disableStream: false });
    loadingTask.promise.then((loaded) => {
      if (!cancelled) setDocument(loaded);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (!document) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const page = Number((entry.target as HTMLElement).dataset.page);
          void renderPage(document, page, scale, entry.target as HTMLDivElement).catch(() => setError(true));
          setPageNumber(page);
        }
      });
    }, { rootMargin: "600px 0px" });
    pageRefs.current.forEach((page) => { if (page) observer.observe(page); });
    return () => observer.disconnect();
  }, [document, scale]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        pageRefs.current[Math.min(pageNumber, pageRefs.current.length - 1)]?.scrollIntoView({ behavior: "smooth" });
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        pageRefs.current[Math.max(pageNumber - 2, 0)]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageNumber]);

  if (error) return <div className="reader-fallback"><p>This PDF could not be rendered in the reader.</p><a className="button button-primary" href={url} target="_blank" rel="noreferrer">Open in new tab</a></div>;
  if (!document) return <div className="reader-fallback" role="status">Loading PDF…</div>;

  return <div>
    <div className="reader-toolbar">
      <span className="meta" aria-live="polite">Page {pageNumber} of {document.numPages}</span>
      <div className="reader-controls" aria-label="PDF controls">
        <button className="button" type="button" onClick={() => setScale((value) => Math.max(.6, value - .2))} aria-label="Zoom out">−</button>
        <span className="meta">{Math.round(scale * 100)}%</span>
        <button className="button" type="button" onClick={() => setScale((value) => Math.min(2.5, value + .2))} aria-label="Zoom in">+</button>
        <button className="button" type="button" onClick={() => {
          const width = surfaceRef.current?.clientWidth || 800;
          setScale(Math.max(.6, Math.min(2.5, width / 800)));
        }}>Fit width</button>
      </div>
    </div>
    <div className="reader-surface" ref={surfaceRef} aria-label={`${title} PDF pages`}>
      {Array.from({ length: document.numPages }, (_, index) => <div className="pdf-page" data-page={index + 1} key={index} ref={(element) => { pageRefs.current[index] = element; }} />)}
    </div>
  </div>;
}

async function renderPage(pdfDocument: PDFDocumentProxy, pageNumber: number, scale: number, container: HTMLDivElement): Promise<void> {
  if (container.dataset.renderedScale === String(scale)) return;
  const page: PDFPageProxy = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = container.querySelector("canvas") || window.document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.setAttribute("aria-label", `Page ${pageNumber}`);
  if (!canvas.parentElement) container.appendChild(canvas);
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
  container.dataset.renderedScale = String(scale);
}
