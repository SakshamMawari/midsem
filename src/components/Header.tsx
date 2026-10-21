import Link from "next/link";
import AddNotesModal from "@/components/AddNotesModal";
import TimetableModal from "@/components/TimetableModal";
import { subjects } from "@/lib/library";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Study Library Home">
          <div className="brand-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span className="brand-title">Study Library</span>
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <TimetableModal subjects={subjects} />
          <AddNotesModal subjects={subjects} buttonVariant="header" buttonLabel="+ Add Notes" />
        </div>
      </div>
    </header>
  );
}
