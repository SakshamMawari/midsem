"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LibrarySubject } from "@/lib/library";

type ModifySubjectModalProps = {
  subject: LibrarySubject;
  buttonLabel?: string;
  buttonVariant?: "ghost" | "primary";
};

export default function ModifySubjectModal({
  subject,
  buttonLabel = "Edit Subject",
  buttonVariant = "ghost"
}: ModifySubjectModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code);
  const [altName, setAltName] = useState(subject.altName || "");
  const [description, setDescription] = useState(subject.description || "");
  const [branches, setBranches] = useState<string[]>(subject.branches || ["DSA"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleBranch(branch: string) {
    setBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Subject name cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_subject",
          subjectSlug: subject.slug,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          altName: altName.trim(),
          description: description.trim(),
          branches
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subject");

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update subject");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setName(subject.name);
          setCode(subject.code);
          setAltName(subject.altName || "");
          setDescription(subject.description || "");
          setBranches(subject.branches || ["DSA"]);
          setIsOpen(true);
        }}
        className={
          buttonVariant === "primary"
            ? "btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            : "btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700/80 hover:border-zinc-500 rounded-lg flex items-center gap-1.5 text-zinc-300 hover:text-white"
        }
        aria-label={`Edit ${subject.name} details`}
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
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modify-subject-title"
        >
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-full mb-1 inline-block">
                  Subject Settings
                </span>
                <h3 id="modify-subject-title" className="text-lg font-bold text-zinc-100">
                  Modify Subject Details
                </h3>
                <p className="text-xs text-zinc-400">
                  Rename subject, update code tag, or modify syllabus description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Subject Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Mining Visual"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Subject Code (No Emojis) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DMV, MDS, IP"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Alternative / Sub-Title
                  </label>
                  <input
                    type="text"
                    value={altName}
                    onChange={(e) => setAltName(e.target.value)}
                    placeholder="e.g. Linear Algebra & Probability"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Branches Assigned
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {(["DSA", "CSE", "AI & IT"] as const).map((branch) => {
                    const active = branches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                          active
                            ? "bg-indigo-950/70 border-indigo-600 text-indigo-300"
                            : "bg-[#1A1A1A] border-[#333] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {branch} {active ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of course contents, concepts, and scope..."
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                  {loading ? "Saving Changes..." : "Save Modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
