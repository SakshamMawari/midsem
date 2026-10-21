import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddNotesModal from "@/components/AddNotesModal";
import Breadcrumbs from "@/components/Breadcrumbs";
import PdfIcon from "@/components/PdfIcon";
import { formatSize, getPdfUrl, getSubject, getUnit, subjects } from "@/lib/library";

type PageProps = {
  params: Promise<{ subject: string; unit: string }>;
};

export function generateStaticParams() {
  return subjects.flatMap((subject) =>
    subject.units.map((unit) => ({
      subject: subject.slug,
      unit: unit.slug
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: subjectSlug, unit: unitSlug } = await params;
  const unit = getUnit(subjectSlug, unitSlug);
  return {
    title: unit?.name || "Unit",
    description: unit?.description || `Study PDFs and lecture documents for ${unit?.name || "this unit"}.`
  };
}

export default async function UnitPage({ params }: PageProps) {
  const { subject: subjectSlug, unit: unitSlug } = await params;
  const subject = getSubject(subjectSlug);
  const unit = getUnit(subjectSlug, unitSlug);

  if (!subject || !unit) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: subject.name, href: `/${subject.slug}` },
          { label: unit.name }
        ]}
      />

      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href={`/${subject.slug}`} className="back-link mb-0">
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
          <span>Back to {subject.name}</span>
        </Link>

        {/* Dedicated "+ Add PDF" Option */}
        <AddNotesModal
          subjects={subjects}
          defaultSubject={subject.slug}
          defaultUnit={unit.slug}
          mode="pdf"
          buttonLabel="+ Add PDF"
          buttonVariant="primary"
        />
      </div>

      <div className="section-header">
        <div className="flex items-center gap-2 mb-2">
          <span className="subject-code-tag text-xs font-mono py-0.5 px-2">
            {subject.code}
          </span>
          <span className="hero-pill mb-0">Unit Documents</span>
          <span className="text-xs text-zinc-500">• {subject.name}</span>
        </div>
        <h1>{unit.name}</h1>
        {unit.description ? (
          <p>{unit.description}</p>
        ) : (
          <p>Browse and open study materials for {unit.name}.</p>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-3">
        <span className="text-sm font-semibold text-zinc-300">
          Available Documents ({unit.files.length})
        </span>
        <span className="text-xs text-zinc-500">Click any document to open directly in a new tab</span>
      </div>

      {unit.files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📄
          </div>
          <h3>No study PDFs in this unit yet</h3>
          <p>
            Study notes for this unit have not been uploaded yet. Click &ldquo;+ Add PDF&rdquo; below to upload notes or drop files into this unit&rsquo;s folder.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <AddNotesModal
              subjects={subjects}
              defaultSubject={subject.slug}
              defaultUnit={unit.slug}
              mode="pdf"
              buttonLabel="+ Add PDF"
              buttonVariant="primary"
            />
            <Link href={`/${subject.slug}`} className="btn btn-ghost">
              ← Back to {subject.name}
            </Link>
          </div>
        </div>
      ) : (
        <div className="pdf-list">
          {unit.files.map((file) => {
            const displayTitle = file.title || file.name;
            const pdfUrl = file.url?.startsWith("http")
              ? file.url
              : getPdfUrl(subject.slug, unit.slug, file.name);

            return (
              <div className="pdf-item" key={file.slug}>
                <div className="pdf-item-main">
                  <div className="pdf-icon-wrapper" aria-hidden="true">
                    <PdfIcon size={24} />
                  </div>

                  <div className="pdf-info">
                    {/* Direct clickable title opening in new tab */}
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pdf-title-link"
                      title={`Open ${displayTitle} directly in new tab`}
                    >
                      {displayTitle}
                    </a>

                    <div className="pdf-meta">
                      <span className="pdf-meta-item">
                        <span className="font-medium text-zinc-400">PDF Document</span>
                      </span>
                      <span className="pdf-meta-dot">•</span>
                      <span className="pdf-meta-item">
                        {formatSize(file.sizeMb, file.sizeFormatted)}
                      </span>
                      {file.pageCount && (
                        <>
                          <span className="pdf-meta-dot">•</span>
                          <span className="pdf-meta-item">
                            {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
                          </span>
                        </>
                      )}
                    </div>

                    {file.description && (
                      <p className="mt-1 text-xs text-zinc-400">{file.description}</p>
                    )}
                  </div>
                </div>

                <div className="pdf-actions">
                  {/* One-click open directly in browser */}
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    aria-label={`Open ${displayTitle} in new tab`}
                  >
                    <span>Open PDF</span>
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

                  {/* Direct download button */}
                  <a
                    href={pdfUrl}
                    download
                    className="btn btn-ghost"
                    aria-label={`Download ${displayTitle}`}
                    title="Download PDF"
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

                  {/* Reader View Link */}
                  <Link
                    href={`/${subject.slug}/${unit.slug}/${file.slug}`}
                    className="btn btn-ghost"
                    title="View in Reader mode"
                  >
                    <span>Reader</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
