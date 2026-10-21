import { promises as fs } from "node:fs";
import path from "node:path";

export type YouTubeResource = {
  id: string;
  title: string;
  url: string;
  channel?: string;
  description?: string;
};

type SubjectMetadata = {
  id?: string;
  code?: string;
  name?: string;
  altName?: string;
  branches?: string[];
  description?: string;
  examDate?: string;
  examTime?: string;
  order?: number;
  youtubeLinks?: YouTubeResource[];
  syllabus?: SyllabusData;
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

type UnitMetadata = {
  id?: string;
  name?: string;
  description?: string;
  order?: number;
  fileOrder?: string[];
  documents?: Record<string, { title?: string; description?: string }>;
};

export type ManifestFile = {
  id: string;
  name: string;
  title: string;
  slug: string;
  path: string;
  url: string;
  sizeMb: number;
  sizeFormatted: string;
  pageCount: number | null;
  description?: string;
};

export type ManifestUnit = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  files: ManifestFile[];
  documents: ManifestFile[];
};

export type ManifestSubject = {
  id: string;
  name: string;
  slug: string;
  code: string;
  branches: string[];
  altName?: string;
  description?: string;
  examDate?: string;
  examTime?: string;
  order: number;
  units: ManifestUnit[];
  youtubeLinks: YouTubeResource[];
  syllabus?: SyllabusData;
};

export type Manifest = {
  subjects: ManifestSubject[];
};

const root = process.cwd();
const libraryDir = path.join(root, "public", "library");
const outputPath = path.join(root, "src", "data", "manifest.json");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanTitle(filename: string): string {
  const stripped = filename.replace(/\.pdf$/i, "").replace(/^\d+[-_.\s]+/, "");
  return stripped
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveSubjectCode(name: string): string {
  const parts = name.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .filter((w) => !["FOR", "AND", "THE", "OF", "IN"].includes(w.toUpperCase()))
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 4);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function pageCount(filePath: string): Promise<number | null> {
  try {
    const data = await fs.readFile(filePath);
    const matches = data.toString("latin1").match(/\/Type\s*\/Page\b/g);
    return matches && matches.length > 0 ? matches.length : null;
  } catch {
    return null;
  }
}

async function entries(directory: string): Promise<import("node:fs").Dirent[]> {
  return fs.readdir(directory, { withFileTypes: true });
}

async function buildManifest(): Promise<Manifest> {
  const subjects: ManifestSubject[] = [];
  await fs.mkdir(libraryDir, { recursive: true });

  for (const subjectEntry of (await entries(libraryDir)).filter((entry) => entry.isDirectory())) {
    const subjectPath = path.join(libraryDir, subjectEntry.name);
    const metadataPath = path.join(subjectPath, "subject.json");
    const metadata = await fs
      .access(metadataPath)
      .then(() => readJson<SubjectMetadata>(metadataPath))
      .catch((): SubjectMetadata => ({}));

    // Read optional youtube.json
    const youtubePath = path.join(subjectPath, "youtube.json");
    const youtubeLinks = await fs
      .access(youtubePath)
      .then(() => readJson<YouTubeResource[]>(youtubePath))
      .catch((): YouTubeResource[] => metadata.youtubeLinks ?? []);

    // Read optional syllabus.json
    const syllabusPath = path.join(subjectPath, "syllabus.json");
    const syllabus = await fs
      .access(syllabusPath)
      .then(() => readJson<SyllabusData>(syllabusPath))
      .catch((): SyllabusData | undefined => metadata.syllabus);

    const units: ManifestUnit[] = [];

    for (const unitEntry of (await entries(subjectPath)).filter((entry) => entry.isDirectory())) {
      const unitPath = path.join(subjectPath, unitEntry.name);
      const unitMetadataPath = path.join(unitPath, "unit.json");
      const unitMetadata = await fs
        .access(unitMetadataPath)
        .then(() => readJson<UnitMetadata>(unitMetadataPath))
        .catch((): UnitMetadata => ({}));
      const seenSlugs = new Set<string>();
      const files: ManifestFile[] = [];

      for (const fileEntry of (await entries(unitPath)).filter(
        (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")
      )) {
        const slug = slugify(fileEntry.name);
        if (seenSlugs.has(slug)) {
          throw new Error(`Duplicate file slug "${slug}" in ${path.relative(root, unitPath)}`);
        }
        seenSlugs.add(slug);
        const filePath = path.join(unitPath, fileEntry.name);
        const stats = await fs.stat(filePath);
        const publicPath = `/library/${subjectEntry.name}/${unitEntry.name}/${encodeURIComponent(fileEntry.name)}`;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vxynlnjltecjwpimndjj.supabase.co";
        const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";
        const storageBaseUrl =
          process.env.NEXT_PUBLIC_PDF_BASE_URL?.replace(/\/$/, "") ||
          `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucketName}/notes`;
        const storageUrl = `${storageBaseUrl}/${subjectEntry.name}/${unitEntry.name}/${encodeURIComponent(fileEntry.name)}`;

        const docMeta = unitMetadata.documents?.[fileEntry.name] || unitMetadata.documents?.[slug];
        const displayTitle = docMeta?.title || cleanTitle(fileEntry.name);

        const manifestFile: ManifestFile = {
          id: slug,
          name: fileEntry.name.replace(/\.pdf$/i, ""),
          title: displayTitle,
          slug,
          path: publicPath,
          url: storageUrl,
          sizeMb: Number((stats.size / (1024 * 1024)).toFixed(2)),
          sizeFormatted: formatFileSize(stats.size),
          pageCount: await pageCount(filePath),
          ...(docMeta?.description ? { description: docMeta.description } : {})
        };

        files.push(manifestFile);
      }

      const unitSlug = unitEntry.name;
      const unitName = unitMetadata.name ?? cleanTitle(unitEntry.name);
      const sortedFiles = files.sort((a, b) => {
        if (unitMetadata.fileOrder && unitMetadata.fileOrder.length > 0) {
          const norm = (str: string) => str.toLowerCase().replace(/\.pdf$/i, "").replace(/[^a-z0-9]/g, "");
          const idxA = unitMetadata.fileOrder.findIndex(
            (item) => norm(item) === norm(a.name) || norm(item) === norm(a.slug)
          );
          const idxB = unitMetadata.fileOrder.findIndex(
            (item) => norm(item) === norm(b.name) || norm(item) === norm(b.slug)
          );
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        return a.title.localeCompare(b.title);
      });

      units.push({
        id: unitMetadata.id ?? unitSlug,
        slug: unitSlug,
        name: unitName,
        ...(unitMetadata.description ? { description: unitMetadata.description } : {}),
        order: unitMetadata.order ?? 0,
        files: sortedFiles,
        documents: sortedFiles
      });
    }

    const subjectSlug = subjectEntry.name;
    const subjectName = metadata.name ?? cleanTitle(subjectEntry.name);
    const code = metadata.code || deriveSubjectCode(subjectName);
    const branches = metadata.branches && metadata.branches.length > 0 ? metadata.branches : ["DSA"];

    subjects.push({
      id: metadata.id ?? subjectSlug,
      slug: subjectSlug,
      name: subjectName,
      code,
      branches,
      ...(metadata.altName ? { altName: metadata.altName } : {}),
      ...(metadata.description ? { description: metadata.description } : {}),
      ...(metadata.examDate ? { examDate: metadata.examDate } : {}),
      ...(metadata.examTime ? { examTime: metadata.examTime } : {}),
      order: metadata.order ?? 0,
      units: units.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
      youtubeLinks,
      ...(syllabus ? { syllabus } : {})
    });
  }

  return { subjects: subjects.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) };
}

async function main(): Promise<void> {
  const manifest = await buildManifest();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const contents = `${JSON.stringify(manifest, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    const current = await fs.readFile(outputPath, "utf8").catch(() => "");
    if (current !== contents) throw new Error("Manifest is stale. Run npm run manifest.");
  } else {
    await fs.writeFile(outputPath, contents);
  }
}

void main();
