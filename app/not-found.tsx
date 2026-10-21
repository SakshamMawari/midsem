import Link from "next/link";
import AddNotesModal from "@/components/AddNotesModal";
import { subjects } from "@/lib/library";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* 404 Hero Banner */}
      <div className="empty-state text-center mb-10">
        <div className="empty-state-icon font-mono font-bold" aria-hidden="true">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-2">
          Page or Study Material Not Found
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-6">
          The subject, syllabus unit, or document you requested has not been created or uploaded yet.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <AddNotesModal
            subjects={subjects}
            mode="all"
            buttonLabel="+ Create Subject or Upload Notes"
            buttonVariant="primary"
          />
          <Link href="/" className="btn btn-ghost border border-zinc-700">
            ← Back to Library Home
          </Link>
        </div>
      </div>

      {/* Quick Navigation to Official Subjects */}
      <div className="border-t border-[#262626] pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Mid-Sem Examination Subjects
          </h2>
          <span className="text-xs text-zinc-500">Official Schedule</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((sub, idx) => (
            <Link
              key={sub.slug}
              href={`/${sub.slug}`}
              className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl hover:border-zinc-500 hover:bg-[#1A1A1A] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-xs font-bold text-indigo-400">
                  {sub.code}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400">Exam {idx + 1}</span>
                    <span className="text-[10px] text-zinc-500">•</span>
                    <span className="text-[10px] text-zinc-400">{sub.examDate}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                    {sub.name}
                  </h3>
                </div>
              </div>
              <span className="text-zinc-500 group-hover:text-zinc-300 text-xs transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
