import type { Metadata } from "next";
import HeroExamCountdown from "@/components/HeroExamCountdown";
import HomeSubjectGrid from "@/components/HomeSubjectGrid";
import SearchBox from "@/components/SearchBox";
import TimetableModal from "@/components/TimetableModal";
import { getLibraryStats, subjects } from "@/lib/library";

export const metadata: Metadata = {
  title: "Midsem Study Library",
  description: "Browse 5th Semester Mid-Sem study materials, timetable, and PDFs with a single click."
};

export default function HomePage() {
  const { totalSubjects, totalUnits, totalPdfs } = getLibraryStats();

  return (
    <div>
      <section className="hero">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="hero-pill mb-0">
            <span>●</span> 5th Semester Mid-Sem Archive
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            IIIT Sonepat (Branches: DSA, CSE, AI & IT)
          </span>
        </div>

        <h1>Your Study Library</h1>
        <p className="hero-subtitle">
          Mid-sem exam subjects mapped directly from the official timetable. Switch branches, browse syllabus units, explore lecture notes, watch recommended YouTube playlists, and open PDFs with a single click.
        </p>

        {/* Large Hero Exam Countdown Clock */}
        <HeroExamCountdown />

        {/* The Only Search Bar */}
        <SearchBox
          subjects={subjects}
          variant="hero"
          placeholder="Search subjects, topics, or PDF notes..."
        />

        {/* Stats Counter Ribbon & Timetable Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="stats-bar mb-0" aria-label="Library statistics">
            <div className="stat-item">
              <span className="stat-value">{totalSubjects}</span>
              <span className="stat-label">Subjects</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <span className="stat-value">{totalUnits}</span>
              <span className="stat-label">Units</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <span className="stat-value">{totalPdfs}</span>
              <span className="stat-label">Study PDFs</span>
            </div>
          </div>

          <TimetableModal subjects={subjects} />
        </div>
      </section>

      {/* Interactive Branch Switcher & Subject Grid with + Add Subject */}
      <HomeSubjectGrid allSubjects={subjects} />
    </div>
  );
}
