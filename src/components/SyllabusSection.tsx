"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LibrarySubject, SyllabusData, SyllabusUnit } from "@/lib/library";

type SyllabusSectionProps = {
  subject: LibrarySubject;
};

export default function SyllabusSection({ subject }: SyllabusSectionProps) {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusData | undefined>(subject.syllabus);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  // Edit form state
  const [credits, setCredits] = useState(subject.syllabus?.credits || "3-0-0");
  const [examPattern, setExamPattern] = useState(
    subject.syllabus?.examPattern || "Mid-Sem: 2 Hours (30 Marks) | End-Sem: 3 Hours (50 Marks)"
  );
  const [unitsJson, setUnitsJson] = useState(
    JSON.stringify(subject.syllabus?.units || [], null, 2)
  );
  const [textbooks, setTextbooks] = useState(
    (subject.syllabus?.textbooks || []).join("\n")
  );
  const [references, setReferences] = useState(
    (subject.syllabus?.references || []).join("\n")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveSyllabus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let parsedUnits: SyllabusUnit[];
      try {
        parsedUnits = JSON.parse(unitsJson);
      } catch {
        throw new Error("Invalid JSON format for Units array.");
      }

      const updatedSyllabus: SyllabusData = {
        courseCode: subject.code,
        courseTitle: subject.name,
        credits: credits.trim(),
        examPattern: examPattern.trim(),
        units: parsedUnits,
        textbooks: textbooks.split("\n").map((t) => t.trim()).filter(Boolean),
        references: references.split("\n").map((r) => r.trim()).filter(Boolean)
      };

      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_syllabus",
          subjectSlug: subject.slug,
          syllabus: updatedSyllabus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update syllabus");

      setSyllabus(updatedSyllabus);
      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save syllabus");
    } finally {
      setLoading(false);
    }
  }

  const units = syllabus?.units || [];

  return (
    <section className="mt-12 pt-8 border-t border-[#262626]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600/20 text-indigo-400 text-xs font-bold font-mono">
              §
            </span>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              Official Examination Syllabus
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Course curriculum, prescribed unit topics, and reference textbooks for {subject.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCredits(syllabus?.credits || "3-0-0");
            setExamPattern(
              syllabus?.examPattern ||
                "Mid-Sem: 2 Hours (30 Marks) | End-Sem: 3 Hours (50 Marks)"
            );
            setUnitsJson(JSON.stringify(syllabus?.units || [], null, 2));
            setTextbooks((syllabus?.textbooks || []).join("\n"));
            setReferences((syllabus?.references || []).join("\n"));
            setIsEditModalOpen(true);
          }}
          className="btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700/80 hover:border-zinc-500 rounded-lg flex items-center gap-1.5 text-zinc-300 hover:text-white"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Modify Syllabus</span>
        </button>
      </div>

      {/* Meta Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-800/40 px-2.5 py-1 rounded-md">
            {syllabus?.courseCode || subject.code}
          </span>
          <div>
            <div className="text-xs font-bold text-zinc-200">
              {syllabus?.courseTitle || subject.name}
            </div>
            {syllabus?.credits && (
              <div className="text-[11px] text-zinc-400">
                Credits (L-T-P): <span className="text-zinc-200">{syllabus.credits}</span>
              </div>
            )}
          </div>
        </div>

        {syllabus?.examPattern && (
          <div className="text-[11px] font-medium text-zinc-400 bg-[#1A1A1A] border border-[#333] px-3 py-1.5 rounded-lg">
            <span className="text-zinc-300 font-semibold">Exam Scheme:</span> {syllabus.examPattern}
          </div>
        )}
      </div>

      {/* Unit Topics Breakdown */}
      {units.length === 0 ? (
        <div className="p-6 bg-[#141414] border border-[#262626] rounded-xl text-center text-xs text-zinc-400">
          No structured syllabus loaded yet. Click &ldquo;Modify Syllabus&rdquo; above to input course units and topics.
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {units.map((u, idx) => {
            const isExpanded = expandedUnit === idx;
            return (
              <div
                key={u.unit || idx}
                className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedUnit(isExpanded ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
                      {u.unit || `Unit ${idx + 1}`}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100">{u.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {isExpanded ? "▲ Collapse" : "▼ Expand Topics"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#1F1F1F] bg-[#161616]">
                    <ul className="space-y-1.5 mt-2">
                      {u.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <span className="text-indigo-500 font-bold mt-0.5">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Books and References */}
      {((syllabus?.textbooks && syllabus.textbooks.length > 0) ||
        (syllabus?.references && syllabus.references.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {syllabus.textbooks && syllabus.textbooks.length > 0 && (
            <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📖</span> Recommended Textbooks
              </h4>
              <ul className="space-y-1.5">
                {syllabus.textbooks.map((b, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-zinc-600 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {syllabus.references && syllabus.references.length > 0 && (
            <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📑</span> Reference Materials & Readings
              </h4>
              <ul className="space-y-1.5">
                {syllabus.references.map((r, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-zinc-600 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Edit Syllabus Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Modify Syllabus: {subject.name}</h3>
                <p className="text-xs text-zinc-400">
                  Update credits, exam scheme, unit-wise topic lists, and reference books.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg border border-zinc-800"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSyllabus} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Credits (L-T-P)</label>
                  <input
                    type="text"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    placeholder="e.g. 3-1-0"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Examination Scheme</label>
                  <input
                    type="text"
                    value={examPattern}
                    onChange={(e) => setExamPattern(e.target.value)}
                    placeholder="e.g. Mid-Sem: 2 Hours (30 Marks)"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Units & Topics (JSON Format)
                </label>
                <textarea
                  rows={8}
                  value={unitsJson}
                  onChange={(e) => setUnitsJson(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg p-3 text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Textbooks (One per line)
                </label>
                <textarea
                  rows={3}
                  value={textbooks}
                  onChange={(e) => setTextbooks(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Reference Books (One per line)
                </label>
                <textarea
                  rows={3}
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-ghost text-xs py-2 px-4 border border-zinc-700"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary text-xs py-2 px-5"
                >
                  {loading ? "Saving Syllabus..." : "Save Syllabus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
