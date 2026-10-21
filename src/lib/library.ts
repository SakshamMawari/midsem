import manifest from "@/data/manifest.json";

export type YouTubeResource = {
  id: string;
  title: string;
  url: string;
  channel?: string;
  description?: string;
};

export type LibraryFile = {
  id?: string;
  name: string;
  title?: string;
  slug: string;
  path: string;
  url?: string;
  sizeMb: number;
  sizeFormatted?: string;
  pageCount: number | null;
  description?: string;
};

export type LibraryUnit = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  files: LibraryFile[];
  documents?: LibraryFile[];
};

export type SyllabusUnit = {
  unit: string;
  title: string;
  topics: string[];
};

export type SyllabusData = {
  courseCode?: string;
  courseTitle?: string;
  credits?: string;
  examPattern?: string;
  units: SyllabusUnit[];
  textbooks?: string[];
  references?: string[];
};

export type LibrarySubject = {
  id?: string;
  name: string;
  slug: string;
  code: string;
  branches: string[];
  altName?: string;
  description?: string;
  examDate?: string;
  examTime?: string;
  order: number;
  units: LibraryUnit[];
  youtubeLinks?: YouTubeResource[];
  syllabus?: SyllabusData;
};

export const subjects: LibrarySubject[] = manifest.subjects as LibrarySubject[];

export const BRANCHES = ["DSA", "CSE", "AI & IT"] as const;
export type Branch = (typeof BRANCHES)[number];

export function getSubjectsByBranch(branch: string): LibrarySubject[] {
  if (!branch || branch === "ALL") return subjects;
  return subjects.filter((s) => s.branches && s.branches.includes(branch));
}

export function getSubject(slug: string): LibrarySubject | undefined {
  return subjects.find((subject) => subject.slug === slug || subject.id === slug);
}

export function getUnit(subjectSlug: string, unitSlug: string): LibraryUnit | undefined {
  const subject = getSubject(subjectSlug);
  return subject?.units.find((unit) => unit.slug === unitSlug || unit.id === unitSlug);
}

export function getFile(subjectSlug: string, unitSlug: string, fileSlug: string): LibraryFile | undefined {
  const unit = getUnit(subjectSlug, unitSlug);
  return unit?.files.find((file) => file.slug === fileSlug || file.id === fileSlug);
}

export function getPdfUrl(subjectSlug: string, unitSlug: string, fileNameOrPath: string): string {
  // If already an absolute Supabase / HTTPS URL, return directly
  if (fileNameOrPath.startsWith("http://") || fileNameOrPath.startsWith("https://")) {
    return fileNameOrPath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vxynlnjltecjwpimndjj.supabase.co";
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";
  const baseUrl =
    process.env.NEXT_PUBLIC_PDF_BASE_URL?.replace(/\/$/, "") ||
    `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucketName}/notes`;

  // Extract clean filename from any local or relative path
  const parts = fileNameOrPath.split("/");
  const rawFileName = decodeURIComponent(parts[parts.length - 1] || "");
  const safeName = rawFileName.endsWith(".pdf") ? rawFileName : `${rawFileName}.pdf`;

  return `${baseUrl}/${subjectSlug}/${unitSlug}/${encodeURIComponent(safeName)}`;
}

export function formatSize(sizeMb: number, formatted?: string): string {
  if (formatted) return formatted;
  if (sizeMb < 0.001) return "< 1 KB";
  if (sizeMb < 1) return `${Math.round(sizeMb * 1024)} KB`;
  return `${sizeMb.toFixed(1)} MB`;
}

export function getLibraryStats(branch?: string) {
  const filtered = branch ? getSubjectsByBranch(branch) : subjects;
  const totalSubjects = filtered.length;
  const totalUnits = filtered.reduce((sum, s) => sum + s.units.length, 0);
  const totalPdfs = filtered.reduce(
    (sum, s) => sum + s.units.reduce((uSum, u) => uSum + u.files.length, 0),
    0
  );
  return { totalSubjects, totalUnits, totalPdfs };
}
