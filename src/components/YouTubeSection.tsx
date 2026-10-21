"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { YouTubeResource } from "@/lib/library";

type YouTubeSectionProps = {
  subjectSlug: string;
  subjectName: string;
  initialLinks?: YouTubeResource[];
};

export default function YouTubeSection({
  subjectSlug,
  subjectName,
  initialLinks = []
}: YouTubeSectionProps) {
  const router = useRouter();
  const [links, setLinks] = useState<YouTubeResource[]>(initialLinks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [channel, setChannel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError("Please provide both a title and a valid YouTube URL.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_youtube",
          subjectSlug,
          title,
          url,
          channel,
          description
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add video link");

      if (data.resource) {
        setLinks((prev) => [...prev, data.resource]);
      }
      setIsModalOpen(false);
      setTitle("");
      setUrl("");
      setChannel("");
      setDescription("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add video link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12 pt-8 border-t border-[#262626]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-600/20 text-red-400 text-xs font-bold">
              ▶
            </span>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              Video Lectures & Online Playlists
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Recommended YouTube lecture series and tutorials for {subjectName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-ghost text-xs py-1.5 px-3 border border-zinc-700 hover:border-zinc-500 flex items-center gap-1.5"
        >
          <span className="text-red-400">▶</span>
          <span>+ Add YouTube Link</span>
        </button>
      </div>

      {links.length === 0 ? (
        <div className="p-6 bg-[#141414] border border-[#262626] rounded-xl text-center">
          <p className="text-xs text-zinc-400 mb-3">
            No video lectures linked for this subject yet.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary text-xs py-1.5 px-3"
          >
            + Add First YouTube Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-zinc-500 hover:bg-[#1A1A1A] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    {item.channel && (
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {item.channel}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-500 text-xs group-hover:text-zinc-200 transition-colors">
                    Watch ↗
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white leading-snug mb-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                <span>YouTube Lecture Series</span>
                <span className="text-indigo-400 group-hover:underline">Open Video →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Add YouTube URL Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Add YouTube Video Lecture</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Attach a lecture series or playlist for {subjectName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleAddLink} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Video / Playlist Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NPTEL Linear Algebra Lecture Series"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/playlist?list=... or https://youtu.be/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Channel / Professor (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gate Smashers, MIT OCW, NPTEL"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Short Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key chapters or concepts covered in this lecture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-2.5 font-semibold"
                >
                  {loading ? "Adding Link..." : "Save YouTube Lecture Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
