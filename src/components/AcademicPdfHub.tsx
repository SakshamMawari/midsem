"use client";

import { useEffect, useState, useMemo } from "react";
import type { DatabaseDocument, DocumentCategory } from "@/lib/supabase/types";
import { formatSize, subjects } from "@/lib/library";

type CategoryFilter = "ALL" | DocumentCategory;

export default function AcademicPdfHub() {
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState(subjects[0]?.name || "Mathematics for Data Science");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("notes");
  const [uploadDescription, setUploadDescription] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== "ALL") params.set("subject", selectedSubject);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load documents");
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || "Failed to connect to documents backend");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const params = new URLSearchParams();
        if (selectedSubject !== "ALL") params.set("subject", selectedSubject);
        if (selectedCategory !== "ALL") params.set("category", selectedCategory);

        const res = await fetch(`/api/documents?${params.toString()}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(data.error || "Failed to load documents");
          setDocuments(data.documents || []);
          setError(null);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || "Failed to connect to documents backend");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, selectedSubject]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchDocuments();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Client-side validation: PDF MIME or extension
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Invalid file type: Please select a valid PDF file.");
      return;
    }

    // Client-side validation: 100 MB limit
    if (file.size > 104857600) {
      setUploadError(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB exceeds the 100 MB limit.`);
      return;
    }

    setUploadFile(file);
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please choose a PDF file to upload.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Please provide a document title.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());
      formData.append("subject", uploadSubject);
      formData.append("category", uploadCategory);
      if (uploadDescription.trim()) formData.append("description", uploadDescription.trim());
      if (adminKey.trim()) formData.append("adminKey", adminKey.trim());

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadSuccess("Document uploaded successfully to Supabase Storage!");
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setIsUploadOpen(false);
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DatabaseDocument) {
    const confirmed = window.confirm(`Are you sure you want to delete "${doc.title}"?`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    try {
      const passcode = window.prompt("Enter admin passcode to authorize deletion (optional if unprotected):") || "";
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          filePath: doc.file_path,
          adminKey: passcode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  // Filtered in-memory list for instant responsiveness
  const displayedDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== "ALL" && doc.category !== selectedCategory) return false;
      if (selectedSubject !== "ALL" && doc.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          doc.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, selectedCategory, selectedSubject, searchQuery]);

  return (
    <div className="w-full">
      {/* Top Banner & Upload Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#121214] border border-[#262626] rounded-2xl mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Cloud Storage & Database
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Academic PDF Documents</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cloud-hosted repository for Lecture Notes, Official Syllabi, and Exam Timetables with single-click preview & download.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setUploadSuccess(null);
            setIsUploadOpen(true);
          }}
          className="btn btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow-lg shadow-indigo-950/50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Upload PDF to Supabase</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3 mb-6 p-4 bg-[#141414] border border-[#262626] rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">Category:</span>
            {(["ALL", "notes", "syllabus", "timetable"] as const).map((cat) => {
              const active = selectedCategory === cat;
              const label = cat === "ALL" ? "All Documents" : cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    active ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60" : "text-zinc-400 hover:text-zinc-200 bg-[#1A1A1A] border border-[#2A2A2A]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description..."
              className="bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 bg-[#222] rounded-md"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Subject Filter Pills */}
        <div className="pt-2 border-t border-[#222] flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">Subject:</span>
          <button
            type="button"
            onClick={() => setSelectedSubject("ALL")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              selectedSubject === "ALL" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200 bg-[#1A1A1A]"
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => {
            const active = selectedSubject === sub.name;
            return (
              <button
                key={sub.slug}
                type="button"
                onClick={() => setSelectedSubject(sub.name)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  active ? "bg-indigo-600/90 text-white" : "text-zinc-400 hover:text-zinc-200 bg-[#1A1A1A]"
                }`}
              >
                {sub.code}: {sub.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Listing State */}
      {loading ? (
        <div className="p-12 text-center bg-[#141414] border border-[#262626] rounded-2xl">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-zinc-400">Loading documents from Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-center">
          <p className="text-sm font-semibold text-red-300 mb-2">Error connecting to documents</p>
          <p className="text-xs text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchDocuments}
            className="btn btn-ghost text-xs py-1.5 px-4 border border-red-800"
          >
            Retry Connection
          </button>
        </div>
      ) : displayedDocs.length === 0 ? (
        <div className="empty-state p-12 text-center bg-[#141414] border border-[#262626] rounded-2xl">
          <div className="empty-state-icon" aria-hidden="true">📑</div>
          <h3 className="text-base font-bold text-zinc-200 mb-1">No documents found</h3>
          <p className="text-xs text-zinc-400 mb-4">
            No matching PDFs found for the selected category and subject filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedSubject("ALL");
              setSearchQuery("");
            }}
            className="btn btn-primary text-xs py-1.5 px-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
            <span>Showing {displayedDocs.length} {displayedDocs.length === 1 ? "document" : "documents"}</span>
            <span className="text-[11px] text-zinc-500">Sorted by newest upload</span>
          </div>

          <div className="space-y-2.5">
            {displayedDocs.map((doc) => {
              const categoryColor =
                doc.category === "syllabus"
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                  : doc.category === "timetable"
                  ? "bg-purple-950/60 text-purple-400 border-purple-800/40"
                  : "bg-blue-950/60 text-blue-400 border-blue-800/40";

              const pdfUrl = doc.public_url || doc.file_path;

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-zinc-700 transition-all gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 shrink-0 mt-0.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${categoryColor}`}>
                          {doc.category}
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {doc.subject}
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs font-mono text-zinc-400">
                          {formatSize(doc.file_size / (1024 * 1024))}
                        </span>
                      </div>

                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-zinc-100 hover:text-indigo-400 transition-colors inline-block"
                      >
                        {doc.title}
                      </a>

                      {doc.description && (
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="text-[11px] text-zinc-500 font-mono mt-1">
                        File: {doc.file_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {/* Open in new tab */}
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      title="Preview PDF directly in browser"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <span>Preview</span>
                    </a>

                    {/* Download button */}
                    <a
                      href={pdfUrl}
                      download={doc.file_name}
                      className="btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700 hover:border-zinc-500 flex items-center gap-1.5 text-zinc-300"
                      title="Download PDF"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download</span>
                    </a>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg border border-transparent hover:border-red-900/40 transition-colors"
                      title="Delete document"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-full mb-1 inline-block">
                  Supabase Storage
                </span>
                <h3 className="text-lg font-bold text-zinc-100">Upload Academic PDF</h3>
                <p className="text-xs text-zinc-400">
                  Secure upload to &lsquo;academic-pdfs&rsquo; bucket and PostgreSQL database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg border border-zinc-800"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* File Selector */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  PDF File <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={handleFileSelect}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-[#1A1A1A] p-2 rounded-lg border border-[#333]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Accepts PDF documents up to 100 MB.</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Document Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Unit 1 Vector Spaces Complete Notes"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subject & Category Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.slug} value={s.name}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="notes">Lecture Notes</option>
                    <option value="syllabus">Course Syllabus</option>
                    <option value="timetable">Midsem Timetable</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Summary of topics covered, unit scope, or revision points..."
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Admin Passcode */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Admin Passcode (If enabled)
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Optional authorization key"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="btn btn-ghost text-xs py-2 px-4 border border-zinc-700"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary text-xs py-2 px-5"
                >
                  {uploading ? "Uploading to Supabase..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
