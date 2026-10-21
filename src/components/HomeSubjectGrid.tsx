"use client";

import { useState } from "react";
import Link from "next/link";
import AddNotesModal from "@/components/AddNotesModal";
import { BRANCHES, type LibrarySubject } from "@/lib/library";

type HomeSubjectGridProps = {
  allSubjects: LibrarySubject[];
};

export default function HomeSubjectGrid({ allSubjects }: HomeSubjectGridProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>("DSA");

  const filteredSubjects =
    selectedBranch === "ALL"
      ? allSubjects
      : allSubjects.filter((s) => s.branches && s.branches.includes(selectedBranch));

  return (
    <div>
      {/* Branch Selector & Add Subject Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-[#121214] border border-[#262626] rounded-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2.5">
            Branch:
          </span>
          {BRANCHES.map((branch) => {
            const isSelected = selectedBranch === branch;
            return (
              <button
                key={branch}
                type="button"
                onClick={() => setSelectedBranch(branch)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1A]"
                }`}
              >
                {branch}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedBranch("ALL")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedBranch === "ALL"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1A]"
            }`}
          >
            All
          </button>
        </div>

        {/* Dedicated "+ Add Subject" Option */}
        <AddNotesModal
          subjects={allSubjects}
          mode="subject"
          buttonLabel="+ Add Subject"
          buttonVariant="primary"
        />
      </div>

      <div className="section-header flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {selectedBranch === "ALL" ? "All Subjects" : `${selectedBranch} Examination Subjects`} ({filteredSubjects.length} Total)
          </h2>
          <p className="text-xs text-zinc-400">
            Chronological exam sequence from official timetable for {selectedBranch} branch.
          </p>
        </div>
        <span className="text-xs text-zinc-500 font-medium">Click any subject to open syllabus units</span>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="empty-state">
          <h3>No subjects for {selectedBranch} branch</h3>
          <p>Click &ldquo;+ Add Subject&rdquo; above to register a subject for this branch.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredSubjects.map((subject, idx) => {
            const subjectPdfCount = subject.units.reduce(
              (sum, u) => sum + u.files.length,
              0
            );

            return (
              <Link
                className="subject-card"
                href={`/${subject.slug}`}
                key={subject.slug}
                aria-label={`Browse ${subject.name}`}
              >
                <div>
                  <div className="subject-card-header">
                    <div className="flex items-center gap-2.5">
                      {/* Clean typographic subject code - NO EMOJIS */}
                      <span className="subject-code-tag" aria-hidden="true">
                        {subject.code}
                      </span>
                      {subject.examDate && (
                        <div className="text-left">
                          <span className="inline-block text-[10px] font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-800/40 px-2 py-0.5 rounded">
                            Exam {idx + 1}: {subject.examDate}
                          </span>
                          {subject.examTime && (
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              {subject.examTime}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="subject-card-arrow" aria-hidden="true">
                      →
                    </span>
                  </div>

                  <div className="subject-card-body">
                    <h2>{subject.name}</h2>
                    {subject.altName && (
                      <p className="text-[11px] font-medium text-zinc-400 mb-1">
                        {subject.altName}
                      </p>
                    )}
                    {subject.description && (
                      <p className="subject-card-description">{subject.description}</p>
                    )}
                  </div>
                </div>

                <div className="subject-card-footer">
                  <span className="badge-count">
                    <span>{subject.units.length}</span> {subject.units.length === 1 ? "Unit" : "Units"}
                  </span>
                  <span className="badge-count">
                    <span>{subjectPdfCount}</span> {subjectPdfCount === 1 ? "PDF" : "PDFs"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
