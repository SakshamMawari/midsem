# Black-Themed Digital Study Library

A clean, modern, responsive website that organizes educational PDF files by **Subjects → Units → PDFs**. The website serves as a digital study library where users can browse subjects, select syllabus units, and open PDF documents with a single click.

---

## Features

- **Modern Dark/Black Theme**:
  - Background: Near-black (`#0A0A0A`)
  - Cards & Panels: Dark charcoal (`#141414`)
  - Borders: Subtle dark gray (`#262626`)
  - Text: High-contrast white (`#F5F5F5`) and muted gray (`#A1A1AA`)
  - Accent Color: Electric indigo/violet (`#6366F1`)
  - PDF Icons: Dedicated document icons with restrained red accent (`#EF4444`)
- **Direct 1-Click PDF Access**:
  - Clicking any PDF title or the "Open PDF ↗" button opens the document directly in the browser in a new tab without extra clicks or forced downloads.
  - Secondary download and in-app reader options are also provided.
- **Unified Omnisearch**:
  - Search across **Subjects**, **Units**, and **PDF Document Titles** simultaneously.
  - Open matching PDF files directly from the search dropdown.
- **Automated Data Management**:
  - Store PDFs in `public/library/<subject>/<unit>/<file>.pdf` (or `public/pdfs/...`).
  - Running `npm run manifest` (or `npm run dev` / `npm run build`) automatically generates [`src/data/manifest.json`](./src/data/manifest.json).
- **Next.js 16 + React 19 Ready**:
  - App Router architecture with static site generation (`generateStaticParams`).
  - Strict TypeScript compliance, zero ESLint warnings, and fast loading.

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm

### Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server (automatically builds manifest)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the library.

---

## Content Organization: Subjects → Units → PDFs

PDF files and metadata are organized under `public/library` (and mirrored at `public/pdfs`):

```text
public/
└── library/
    ├── mds/                                    <-- Subject folder (slug)
    │   ├── subject.json                        <-- Optional subject metadata
    │   ├── unit-1-fields-and-vector-spaces/    <-- Unit folder (slug)
    │   │   ├── unit.json                       <-- Optional unit metadata
    │   │   ├── 01-lecture-notes.pdf            <-- PDF file
    │   │   └── 02-axioms-cheatsheet.pdf        <-- PDF file
    │   └── unit-2-subspaces/
    │       └── 01-subspaces-and-spans.pdf
    └── probability-and-statistics/
        ├── subject.json
        └── unit-1-distributions/
            └── 01-random-variables.pdf
```

---

## How to Add Content

### 1. Add a New Subject

Create a new directory in `public/library/<subject-slug>`, for example:

```bash
mkdir -p public/library/physics
```

Add an optional `subject.json` inside the directory:

```json
{
  "name": "Classical Mechanics & Relativity",
  "description": "Newtonian mechanics, Lagrangian formulations, and special relativity.",
  "icon": "⚛️",
  "order": 4
}
```

> **Note**: If `subject.json` is omitted, the folder name will automatically be formatted into title-case and assigned a default icon.

### 2. Add a New Unit

Create a subfolder inside the subject directory:

```bash
mkdir -p public/library/physics/unit-1-newtonian-mechanics
```

Add an optional `unit.json`:

```json
{
  "name": "Unit 1: Newtonian Mechanics",
  "description": "Inertial frames, Newton's laws of motion, conservation of momentum and energy.",
  "order": 1
}
```

### 3. Add a New PDF File

Place any standard `.pdf` document inside the unit directory:

```bash
cp /path/to/my-notes.pdf public/library/physics/unit-1-newtonian-mechanics/01-newtonian-dynamics.pdf
```

Then rebuild or run the development server:

```bash
npm run dev
# or regenerate the manifest directly:
npm run manifest
```

The manifest script automatically:
1. Calculates file sizes (e.g. `142 KB` or `2.4 MB`).
2. Detects page counts.
3. Formats clean, human-readable display titles.
4. Generates static routes and search indexing.

---

## Static Hosting & Deployment

This project builds as a static-first Next.js application that can be hosted on **Vercel**, **Cloudflare Pages**, **Netlify**, or **AWS/GCP/Static CDN**.

### Deploying to Vercel (Recommended)

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to the [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. The framework will be auto-detected as **Next.js**.
4. Click **Deploy**. Vercel will automatically run:
   ```bash
   npm run build
   ```
   (which triggers `npm run manifest` first).

### Deploying via Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

### Automated CI/CD via GitHub Actions

This repository includes a production-ready workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) that automatically runs quality gates and deploys to Vercel whenever changes are pushed.

#### Workflow Stages:
1. **Quality Checks (`quality-check`)**: Runs manifest validation (`npm run test:manifest`), ESLint (`npm run lint`), TypeScript checks (`npx tsc --noEmit`), and builds Next.js (`npm run build`).
2. **Deploy to Vercel (`deploy`)**:
   - Pushes to `main`: Prebuilds and deploys directly to **Production**.
   - Pull Requests: Builds and deploys an isolated **Preview** environment with a live URL in the GitHub summary.

#### Setting up GitHub Secrets:
To connect your GitHub repository with Vercel, add these 3 secrets in GitHub under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | How to Get It |
|---|---|
| `VERCEL_TOKEN` | Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Run `npx vercel link` locally (found in `.vercel/project.json` as `orgId`), or in Vercel Dashboard under Team/Account Settings |
| `VERCEL_PROJECT_ID` | Run `npx vercel link` locally (found in `.vercel/project.json` as `projectId`), or in Vercel Project Settings → General |

### Static Build Validation Commands

Before pushing, you can verify your code and static pages:

```bash
npm run manifest       # Regenerate manifest from folder structure
npm run test:manifest  # Validate manifest freshness & ensure no duplicate slugs
npm run lint           # Check ESLint rules
npx tsc --noEmit       # Verify TypeScript types
npm run build          # Create optimized production build
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical website URL used for metadata and OpenGraph tags. |
| `NEXT_PUBLIC_PDF_BASE_URL` | `/library` | Base URL for static PDF files. Point to a CDN or S3 bucket if hosting large collections externally. |
| `SITE_INDEXABLE` | `false` | Set to `true` to enable search engine indexing in robots.txt. |
>>>>>>> 40f1b72 (feat: initialize academic document library web application with Next.js and Supabase)
