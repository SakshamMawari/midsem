import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PdfIcon from "@/components/PdfIcon";
import PdfReader from "@/components/PdfReader";
import { formatSize, getFile, getPdfUrl, getSubject, getUnit, subjects } from "@/lib/library";

type PageProps = {
  params: Promise<{ subject: string; unit: string; file: string }>;
};

export function generateStaticParams() {
  return subjects.flatMap((subject) =>
    subject.units.flatMap((unit) =>
      unit.files.map((file) => ({
        subject: subject.slug,
        unit: unit.slug,
        file: file.slug
      }))
    )
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: subjectSlug, unit: unitSlug, file: fileSlug } = await params;
  const file = getFile(subjectSlug, unitSlug, fileSlug);
  const title = file?.title || file?.name || "Study Document";
  return {
    title,
    description: file?.description || `Read ${title} in the study library.`
  };
}

export default async function FilePage({ params }: PageProps) {
  const { subject: subjectSlug, unit: unitSlug, file: fileSlug } = await params;
  const subject = getSubject(subjectSlug);
  const unit = getUnit(subjectSlug, unitSlug);
  const file = getFile(subjectSlug, unitSlug, fileSlug);

  if (!subject || !unit || !file) {
    notFound();
  }

  const displayTitle = file.title || file.name;
  const pdfUrl = file.url?.startsWith("http")
    ? file.url
    : getPdfUrl(subject.slug, unit.slug, file.name);

  return (
    <div className="reader-page">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: subject.name, href: `/${subject.slug}` },
          { label: unit.name, href: `/${subject.slug}/${unit.slug}` },
          { label: displayTitle }
        ]}
      />

      <Link href={`/${subject.slug}/${unit.slug}`} className="back-link">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to {unit.name}</span>
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <PdfIcon size={26} />
          <span className="hero-pill mb-0">PDF Document</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-2">
          {displayTitle}
        </h1>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{subject.name}</span>
          <span>•</span>
          <span>{unit.name}</span>
          <span>•</span>
          <span>{formatSize(file.sizeMb, file.sizeFormatted)}</span>
          {file.pageCount && (
            <>
              <span>•</span>
              <span>{file.pageCount} pages</span>
            </>
          )}
        </div>
      </div>

      <div className="reader-toolbar">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Reader Mode
          </span>
        </div>

        <div className="reader-actions">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            title="Open original PDF in browser tab"
          >
            <span>Open in New Tab</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <a
            href={pdfUrl}
            download
            className="btn btn-ghost"
            title="Download PDF file"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </a>
        </div>
      </div>

      <PdfReader title={displayTitle} url={pdfUrl} />
    </div>
  );
}
