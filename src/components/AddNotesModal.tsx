"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LibrarySubject } from "@/lib/library";

type AddNotesModalProps = {
  subjects: LibrarySubject[];
  defaultSubject?: string;
  defaultUnit?: string;
  buttonLabel?: string;
  buttonVariant?: "primary" | "secondary" | "header" | "ghost";
  mode?: "subject" | "unit" | "pdf" | "all";
};

export default function AddNotesModal({
  subjects,
  defaultSubject,
  defaultUnit,
  buttonLabel,
  buttonVariant = "secondary",
  mode = "all"
}: AddNotesModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"notes" | "subject" | "unit">(
    mode === "subject" ? "subject" : mode === "unit" ? "unit" : "notes"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Notes Form State
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject || (subjects[0]?.slug ?? ""));
  const [selectedUnit, setSelectedUnit] = useState(defaultUnit || "");
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Unit Form State
  const [unitSubject, setUnitSubject] = useState(defaultSubject || (subjects[0]?.slug ?? ""));
  const [unitName, setUnitName] = useState("");
  const [unitDesc, setUnitDesc] = useState("");

  // Subject Form State
  const [subjName, setSubjName] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjBranches, setSubjBranches] = useState<string[]>(["DSA"]);
  const [subjDesc, setSubjDesc] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");

  const currentSubjectObj = subjects.find((s) => s.slug === (selectedSubject || defaultSubject));
  const availableUnits = currentSubjectObj?.units || [];

  const displayButtonLabel =
    buttonLabel ||
    (mode === "subject"
      ? "+ Add Subject"
      : mode === "unit"
      ? "+ Add Unit"
      : mode === "pdf"
      ? "+ Add PDF"
      : "+ Add Notes / Subject");

  async function handleUploadNotes(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const sub = selectedSubject || defaultSubject;
    const un = selectedUnit || defaultUnit;

    if (!sub) {
      setError("Please select a subject.");
      return;
    }
    if (!un) {
      setError("Please select a unit.");
      return;
    }
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("action", "upload_pdf");
      formData.append("subjectSlug", sub);
      formData.append("unitSlug", un);
      formData.append("title", docTitle || file.name.replace(/\.pdf$/i, ""));
      formData.append("description", docDescription);
      formData.append("file", file);

      const res = await fetch("/api/create", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file");

      setSuccess("PDF uploaded and indexed successfully!");
      setTimeout(() => {
        setIsOpen(false);
        router.push(data.redirectUrl || `/${sub}/${un}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to upload notes");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const sub = unitSubject || defaultSubject;
    if (!sub) {
      setError("Please select a subject.");
      return;
    }
    if (!unitName.trim()) {
      setError("Please enter a unit name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_unit",
          subjectSlug: sub,
          unitName: unitName.trim(),
          description: unitDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create unit");

      setSuccess("Unit created successfully!");
      setTimeout(() => {
        setIsOpen(false);
        router.push(data.redirectUrl || `/${sub}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to create unit");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subjName.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_subject",
          name: subjName.trim(),
          code: subjCode.trim() || undefined,
          branches: subjBranches,
          description: subjDesc.trim(),
          examDate: examDate.trim() || undefined,
          examTime: examTime.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create subject");

      setSuccess("Subject created successfully!");
      setTimeout(() => {
        setIsOpen(false);
        router.push(data.redirectUrl || "/");
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(null);
          if (mode === "subject") setTab("subject");
          else if (mode === "unit") setTab("unit");
          else if (mode === "pdf") setTab("notes");
        }}
        className={
          buttonVariant === "primary"
            ? "btn btn-primary"
            : buttonVariant === "header"
            ? "btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700 hover:border-zinc-500"
            : buttonVariant === "ghost"
            ? "btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700/80"
            : "btn"
        }
      >
        <span>{displayButtonLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tab === "notes"
                    ? "Upload PDF Document"
                    : tab === "unit"
                    ? "Add Syllabus Unit"
                    : "Add New Subject"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {tab === "notes"
                    ? "Upload study notes directly to the library"
                    : tab === "unit"
                    ? "Create a new unit topic under a subject"
                    : "Add an examination subject to the branch catalog"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher if mode === "all" */}
            {mode === "all" && (
              <div className="flex rounded-lg bg-[#1C1C1F] p-1 mb-4 border border-[#262626]">
                <button
                  type="button"
                  onClick={() => {
                    setTab("notes");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    tab === "notes"
                      ? "bg-[#27272A] text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Add PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("unit");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    tab === "unit"
                      ? "bg-[#27272A] text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Add Unit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("subject");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    tab === "subject"
                      ? "bg-[#27272A] text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Add Subject
                </button>
              </div>
            )}

            {error && (
              <div className="mb-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded text-xs text-emerald-300">
                {success}
              </div>
            )}

            {/* TAB 1: ADD PDF */}
            {tab === "notes" && (
              <form onSubmit={handleUploadNotes} className="space-y-3.5">
                {!defaultSubject && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Subject *
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value);
                        setSelectedUnit("");
                      }}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!defaultUnit && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Unit *
                    </label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                      required
                    >
                      <option value="">-- Choose Unit --</option>
                      {availableUnits.map((u) => (
                        <option key={u.slug} value={u.slug}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Document Display Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit Notes & Solved Midsem Problems"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Short Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Key derivations, chapter summary, or formula sheet"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Select PDF File *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg p-2 text-xs text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#27272A] file:text-white hover:file:bg-[#3F3F46] cursor-pointer"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-2.5 font-semibold"
                  >
                    {loading ? "Uploading & Indexing..." : "Upload PDF to Unit"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ADD UNIT */}
            {tab === "unit" && (
              <form onSubmit={handleCreateUnit} className="space-y-3.5">
                {!defaultSubject && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Subject *
                    </label>
                    <select
                      value={unitSubject}
                      onChange={(e) => setUnitSubject(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Unit Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 4: Support Vector Machines & Kernels"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Unit Syllabus Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key concepts, subtopics, and chapters..."
                    value={unitDesc}
                    onChange={(e) => setUnitDesc(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-2.5 font-semibold"
                  >
                    {loading ? "Creating..." : "Create Unit"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ADD SUBJECT */}
            {tab === "subject" && (
              <form onSubmit={handleCreateSubject} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Operating Systems"
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DOS"
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Applicable Branch
                    </label>
                    <div className="flex gap-2 pt-1 text-xs">
                      {["DSA", "CSE", "AI & IT"].map((b) => (
                        <label key={b} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subjBranches.includes(b)}
                            onChange={(e) => {
                              if (e.target.checked) setSubjBranches([...subjBranches, b]);
                              else setSubjBranches(subjBranches.filter((x) => x !== b));
                            }}
                          />
                          <span>{b}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Subject Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the course and syllabus..."
                    value={subjDesc}
                    onChange={(e) => setSubjDesc(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Exam Date (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 28.10.2026"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Exam Time (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02:00 PM – 04:00 PM"
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-2.5 font-semibold"
                  >
                    {loading ? "Creating..." : "Create Subject"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
