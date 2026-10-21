import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddNotesModal from "@/components/AddNotesModal";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import ModifySubjectModal from "@/components/ModifySubjectModal";
import SyllabusSection from "@/components/SyllabusSection";
import YouTubeSection from "@/components/YouTubeSection";
import { getSubject, subjects } from "@/lib/library";

type PageProps = {
  params: Promise<{ subject: string }>;
};

export function generateStaticParams() {
  return subjects.map((subject) => ({ subject: subject.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: subjectSlug } = await params;
  const subject = getSubject(subjectSlug);
  return {
    title: subject?.name || "Subject",
    description: subject?.description || `Units and study materials for ${subject?.name || "Subject"}.`
  };
}

export default async function SubjectPage({ params }: PageProps) {
  const { subject: subjectSlug } = await params;
  const subject = getSubject(subjectSlug);

  if (!subject) {
    notFound();
  }

  const totalSubjectPdfs = subject.units.reduce((sum, u) => sum + u.files.length, 0);

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: subject.name }
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link href="/" className="back-link mb-0">
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
          <span>All Subjects</span>
        </Link>

        {/* Action Toolbar: Modify Subject & Add Unit */}
        <div className="flex items-center gap-2 flex-wrap">
          <ModifySubjectModal subject={subject} buttonLabel="Modify Subject" />
          <AddNotesModal
            subjects={subjects}
            defaultSubject={subject.slug}
            mode="unit"
            buttonLabel="+ Add Unit"
            buttonVariant="primary"
          />
        </div>
      </div>

      <div className="section-header">
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
          {/* Typographic Subject Code Tag - NO EMOJIS */}
          <span className="subject-code-tag text-sm font-mono py-1 px-3">
            {subject.code}
          </span>
          <span className="hero-pill mb-0">Syllabus Units</span>
          {subject.examDate && (
            <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
              Exam: {subject.examDate} ({subject.examTime})
            </span>
          )}
          {subject.branches && (
            <span className="text-xs text-zinc-400 bg-[#1A1A1A] border border-[#262626] px-2.5 py-1 rounded-md">
              Branches: {subject.branches.join(", ")}
            </span>
          )}
        </div>
        <h1>{subject.name}</h1>
        {subject.altName && (
          <p className="text-sm font-semibold text-zinc-400 mb-1">{subject.altName}</p>
        )}
        {subject.description ? (
          <p>{subject.description}</p>
        ) : (
          <p>Explore units, lectures notes, and reading materials for {subject.name}.</p>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-3">
        <span className="text-sm font-semibold text-zinc-300">
          Units ({subject.units.length})
        </span>
        <span className="text-xs text-zinc-500">
          {totalSubjectPdfs} {totalSubjectPdfs === 1 ? "document" : "documents"} available
        </span>
      </div>

      {subject.units.length === 0 ? (
        <EmptyState
          title="No units found for this subject"
          message="Click '+ Add Unit' above to create a unit and upload reading materials."
          actionText="← Back to all subjects"
          actionHref="/"
        />
      ) : (
        <div className="card-grid">
          {subject.units.map((unit, index) => (
            <Link
              key={unit.slug}
              href={`/${subject.slug}/${unit.slug}`}
              className="unit-card"
              aria-label={`Open ${unit.name}`}
            >
              <div>
                <div className="unit-card-header">
                  <span className="unit-card-tag">Unit {index + 1}</span>
                  <span className="text-zinc-500 text-xs">
                    {unit.files.length} {unit.files.length === 1 ? "PDF" : "PDFs"}
                  </span>
                </div>

                <h2>{unit.name}</h2>
                {unit.description && <p className="unit-card-desc">{unit.description}</p>}
              </div>

              <div className="unit-card-footer">
                <span className="text-zinc-500 text-xs">
                  {unit.files.length === 0 ? "No PDFs yet" : "Direct PDF access"}
                </span>
                <span className="unit-action-text">
                  Browse Unit <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Official Syllabus Section */}
      <SyllabusSection subject={subject} />

      {/* YouTube Video Lectures & Playlists Section */}
      <YouTubeSection
        subjectSlug={subject.slug}
        subjectName={subject.name}
        initialLinks={subject.youtubeLinks || []}
      />
    </div>
  );
}
