"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRANCHES, type LibrarySubject } from "@/lib/library";

type TimetableModalProps = {
  subjects: LibrarySubject[];
  initialBranch?: string;
};

export default function TimetableModal({ subjects, initialBranch = "DSA" }: TimetableModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);

  const filteredSubjects =
    selectedBranch === "ALL"
      ? subjects
      : subjects.filter((s) => s.branches && s.branches.includes(selectedBranch));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700/80 hover:border-zinc-500 rounded-lg flex items-center gap-1.5 text-zinc-300"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>Midsem Timetable</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="timetable-title"
        >
          <div className="relative w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-full mb-1">
                  IIIT Sonepat • Oct 2026 Notification
                </div>
                <h3 id="timetable-title" className="text-xl font-bold text-zinc-100">
                  5th Semester Mid-Sem Exam Schedule
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Exam Timing: 02:00 PM – 04:00 PM (ML: 10:00 AM – 12:00 NN)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
                aria-label="Close timetable"
              >
                ✕
              </button>
            </div>

            {/* Branch Switcher Inside Timetable */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1A] border border-[#262626] rounded-xl mb-5 w-fit">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">
                Select Branch:
              </span>
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBranch(b)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedBranch === b
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {b}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedBranch === "ALL"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
            </div>

            {/* Exam Schedule Table */}
            <div className="space-y-3 mb-6">
              {filteredSubjects.map((sub, idx) => (
                <div
                  key={sub.slug}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#191919] border border-[#262626] rounded-xl hover:border-zinc-600 transition-all gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-md font-mono text-xs font-bold text-indigo-400 mt-0.5">
                      {sub.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-400">Exam {idx + 1}</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs font-semibold text-zinc-200">
                          {sub.examDate || "Scheduled"}
                        </span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-400">{sub.examTime || "02:00 PM – 04:00 PM"}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 mt-0.5">{sub.name}</h4>
                      {sub.altName && (
                        <p className="text-[11px] text-zinc-400">{sub.altName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                      2 Hours
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timetable Original Scan Toggle */}
            <div className="pt-4 border-t border-[#262626] flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-zinc-400">
                Official Examination Notification: Ref. No. IIITS/Exam/2026-27/96
              </span>
              <button
                type="button"
                onClick={() => setShowImage(!showImage)}
                className="btn btn-ghost text-xs py-1 px-3 border border-zinc-700"
              >
                {showImage ? "Hide Circular Image" : "View Circular Photo"}
              </button>
            </div>

            {showImage && (
              <div className="mt-4 p-2 bg-black border border-zinc-800 rounded-xl overflow-hidden flex justify-center">
                <Image
                  src="/Timetable.jpeg"
                  alt="Official Notification For Mid Sem Exam October 2026"
                  width={600}
                  height={850}
                  className="max-h-96 w-auto rounded object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
