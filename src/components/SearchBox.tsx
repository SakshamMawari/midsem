"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import PdfIcon from "@/components/PdfIcon";
import type { LibrarySubject } from "@/lib/library";

type SearchBoxProps = {
  subjects: LibrarySubject[];
  variant?: "header" | "hero";
  placeholder?: string;
};

type MatchedPdf = {
  type: "pdf";
  id: string;
  title: string;
  url: string;
  sizeFormatted?: string;
  subjectName: string;
  subjectSlug: string;
  unitName: string;
  unitSlug: string;
};

type MatchedUnit = {
  type: "unit";
  id: string;
  name: string;
  subjectName: string;
  subjectSlug: string;
  unitSlug: string;
  fileCount: number;
};

type MatchedSubject = {
  type: "subject";
  id: string;
  name: string;
  subjectSlug: string;
  code: string;
  unitCount: number;
};

export default function SearchBox({
  subjects,
  variant = "header",
  placeholder = "Search subjects, units, or PDFs..."
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const normalized = query.trim().toLowerCase();

  // Search subjects, units, and PDF documents
  const pdfMatches: MatchedPdf[] = [];
  const unitMatches: MatchedUnit[] = [];
  const subjectMatches: MatchedSubject[] = [];

  if (normalized) {
    for (const subject of subjects) {
      if (
        subject.name.toLowerCase().includes(normalized) ||
        subject.description?.toLowerCase().includes(normalized)
      ) {
        subjectMatches.push({
          type: "subject",
          id: subject.slug,
          name: subject.name,
          subjectSlug: subject.slug,
          code: subject.code,
          unitCount: subject.units.length
        });
      }

      for (const unit of subject.units) {
        if (
          unit.name.toLowerCase().includes(normalized) ||
          unit.description?.toLowerCase().includes(normalized)
        ) {
          unitMatches.push({
            type: "unit",
            id: `${subject.slug}-${unit.slug}`,
            name: unit.name,
            subjectName: subject.name,
            subjectSlug: subject.slug,
            unitSlug: unit.slug,
            fileCount: unit.files.length
          });
        }

        for (const file of unit.files) {
          const title = file.title || file.name;
          if (
            title.toLowerCase().includes(normalized) ||
            file.name.toLowerCase().includes(normalized) ||
            file.description?.toLowerCase().includes(normalized) ||
            `${subject.name} ${unit.name} ${title}`.toLowerCase().includes(normalized)
          ) {
            pdfMatches.push({
              type: "pdf",
              id: `${subject.slug}-${unit.slug}-${file.slug}`,
              title,
              url: file.url || file.path,
              sizeFormatted: file.sizeFormatted,
              subjectName: subject.name,
              subjectSlug: subject.slug,
              unitName: unit.name,
              unitSlug: unit.slug
            });
          }
        }
      }
    }
  }

  const totalMatches = pdfMatches.length + unitMatches.length + subjectMatches.length;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`search-container ${variant === "hero" ? "in-hero" : "in-header"}`}
      onKeyDown={handleKeyDown}
    >
      <label className="sr-only" htmlFor={inputId}>
        Search study library
      </label>
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="search-input"
          role="combobox"
          aria-expanded={isOpen && Boolean(normalized)}
          aria-controls="search-dropdown-list"
          autoComplete="off"
          spellCheck={false}
          suppressHydrationWarning
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && normalized && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {totalMatches === 0 ? (
            <div className="empty-search-state">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#71717A"
                strokeWidth="1.5"
                className="mx-auto mb-2 opacity-60"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" strokeDasharray="2 2" />
              </svg>
              <p className="font-medium text-zinc-300">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-zinc-500">Try searching by topic, subject, unit name, or document title.</p>
            </div>
          ) : (
            <>
              {/* PDF Documents Section */}
              {pdfMatches.length > 0 && (
                <div>
                  <div className="search-section-header">PDF Documents ({pdfMatches.length})</div>
                  {pdfMatches.slice(0, 6).map((pdf) => (
                    <a
                      key={pdf.id}
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="search-result-item"
                      onClick={() => setIsOpen(false)}
                      title={`Open ${pdf.title} in new tab`}
                    >
                      <div className="search-result-info">
                        <PdfIcon size={18} />
                        <div className="search-result-text">
                          <div className="search-result-title">{pdf.title}</div>
                          <div className="search-result-meta">
                            {pdf.subjectName} › {pdf.unitName}
                            {pdf.sizeFormatted ? ` · ${pdf.sizeFormatted}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className="search-action-btn">Open ↗</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Units Section */}
              {unitMatches.length > 0 && (
                <div>
                  <div className="search-section-header">Units ({unitMatches.length})</div>
                  {unitMatches.slice(0, 4).map((unit) => (
                    <Link
                      key={unit.id}
                      href={`/${unit.subjectSlug}/${unit.unitSlug}`}
                      className="search-result-item"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="search-result-info">
                        <span className="search-result-badge badge-unit">Unit</span>
                        <div className="search-result-text">
                          <div className="search-result-title">{unit.name}</div>
                          <div className="search-result-meta">{unit.subjectName}</div>
                        </div>
                      </div>
                      <span className="search-action-btn">{unit.fileCount} {unit.fileCount === 1 ? "PDF" : "PDFs"}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Subjects Section */}
              {subjectMatches.length > 0 && (
                <div>
                  <div className="search-section-header">Subjects ({subjectMatches.length})</div>
                  {subjectMatches.slice(0, 3).map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/${sub.subjectSlug}`}
                      className="search-result-item"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="search-result-info">
                        <span className="search-result-badge badge-subject font-mono">{sub.code}</span>
                        <div className="search-result-text">
                          <div className="search-result-title">{sub.name}</div>
                          <div className="search-result-meta">{sub.unitCount} {sub.unitCount === 1 ? "unit" : "units"}</div>
                        </div>
                      </div>
                      <span className="search-action-btn">View →</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
