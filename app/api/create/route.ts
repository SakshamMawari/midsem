import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const root = process.cwd();
const libraryDir = path.join(root, "public", "library");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action") as string;
      const subjectSlug = (formData.get("subjectSlug") as string)?.trim();
      const unitSlug = (formData.get("unitSlug") as string)?.trim();

      if (action === "upload_pdf") {
        const file = formData.get("file") as File;
        const title = (formData.get("title") as string)?.trim();
        const description = (formData.get("description") as string)?.trim();

        if (!subjectSlug || !unitSlug || !file) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const targetDir = path.join(libraryDir, subjectSlug, unitSlug);
        await fs.mkdir(targetDir, { recursive: true });

        const originalName = file.name || "notes.pdf";
        const safeName = originalName.endsWith(".pdf") ? originalName : `${originalName}.pdf`;
        const targetFilePath = path.join(targetDir, safeName);

        const bytes = await file.arrayBuffer();

        // If Supabase is configured, upload to Supabase Storage & Database (essential for Vercel)
        let supabaseSuccess = false;
        try {
          const { isSupabaseServerConfigured, getSupabaseAdminClient } = await import("@/lib/supabase/server");
          if (isSupabaseServerConfigured()) {
            const supabase = getSupabaseAdminClient();
            if (supabase) {
              const storagePath = `notes/${subjectSlug}/${unitSlug}/${Date.now()}-${safeName}`;
              const { error: uploadErr } = await supabase.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs")
                .upload(storagePath, Buffer.from(bytes), {
                  contentType: "application/pdf",
                  upsert: true
                });

              if (!uploadErr) {
                await supabase.from("documents").insert({
                  title: title || safeName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
                  description: description || null,
                  subject: subjectSlug,
                  category: "notes",
                  file_path: storagePath,
                  file_name: originalName,
                  file_size: file.size
                });
                supabaseSuccess = true;
              }
            }
          }
        } catch (supabaseErr) {
          console.warn("Supabase upload in /api/create skipped or failed:", supabaseErr);
        }

        // Local filesystem fallback (works in local dev environments)
        try {
          await fs.writeFile(targetFilePath, Buffer.from(bytes));
          const unitJsonPath = path.join(targetDir, "unit.json");
          let unitData: any = {};
          try {
            unitData = JSON.parse(await fs.readFile(unitJsonPath, "utf8"));
          } catch {}

          if (!unitData.documents) unitData.documents = {};
          unitData.documents[safeName] = {
            title: title || safeName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "),
            description: description || ""
          };

          await fs.writeFile(unitJsonPath, JSON.stringify(unitData, null, 2));
          await execAsync("npm run manifest");
        } catch (fsErr) {
          // If running on Vercel's read-only filesystem but Supabase succeeded, return success
          if (!supabaseSuccess) throw fsErr;
        }

        return NextResponse.json({
          success: true,
          message: "PDF uploaded successfully",
          redirectUrl: `/${subjectSlug}/${unitSlug}`
        });
      }
    }

    const body = await request.json();
    const { action } = body;

    // 1. CREATE SUBJECT
    if (action === "create_subject") {
      const { name, code, branches, description, examDate, examTime } = body;
      if (!name) {
        return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
      }

      const slug = body.slug ? slugify(body.slug) : slugify(name);
      const subjectPath = path.join(libraryDir, slug);
      await fs.mkdir(subjectPath, { recursive: true });

      const subjectJson = {
        name,
        code: code || name.slice(0, 3).toUpperCase(),
        branches: branches && branches.length > 0 ? branches : ["DSA"],
        description: description || "",
        ...(examDate ? { examDate } : {}),
        ...(examTime ? { examTime } : {}),
        order: 99
      };

      await fs.writeFile(
        path.join(subjectPath, "subject.json"),
        JSON.stringify(subjectJson, null, 2)
      );

      // Create a default Unit 1
      const defaultUnitPath = path.join(subjectPath, "unit-1");
      await fs.mkdir(defaultUnitPath, { recursive: true });
      await fs.writeFile(
        path.join(defaultUnitPath, "unit.json"),
        JSON.stringify(
          {
            name: "Unit 1: Overview & Fundamentals",
            description: `Core syllabus topics for ${name}.`,
            order: 1
          },
          null,
          2
        )
      );

      await execAsync("npm run manifest");

      return NextResponse.json({
        success: true,
        message: "Subject created successfully",
        redirectUrl: `/${slug}`
      });
    }

    // 2. CREATE UNIT
    if (action === "create_unit") {
      const { subjectSlug, unitName, description } = body;
      if (!subjectSlug || !unitName) {
        return NextResponse.json({ error: "Subject and Unit Name required" }, { status: 400 });
      }

      const unitSlug = slugify(unitName);
      const unitPath = path.join(libraryDir, subjectSlug, unitSlug);
      await fs.mkdir(unitPath, { recursive: true });

      const unitJson = {
        name: unitName,
        description: description || "",
        order: 99
      };

      await fs.writeFile(path.join(unitPath, "unit.json"), JSON.stringify(unitJson, null, 2));

      await execAsync("npm run manifest");

      return NextResponse.json({
        success: true,
        message: "Unit created successfully",
        redirectUrl: `/${subjectSlug}/${unitSlug}`
      });
    }

    // 3. ADD YOUTUBE RESOURCE
    if (action === "add_youtube") {
      const { subjectSlug, title, url, channel, description } = body;
      if (!subjectSlug || !title || !url) {
        return NextResponse.json({ error: "Subject, Title, and YouTube URL are required" }, { status: 400 });
      }

      const subjectPath = path.join(libraryDir, subjectSlug);
      await fs.mkdir(subjectPath, { recursive: true });

      const youtubePath = path.join(subjectPath, "youtube.json");
      let currentList: any[] = [];
      try {
        currentList = JSON.parse(await fs.readFile(youtubePath, "utf8"));
      } catch {}

      const newResource = {
        id: `yt-${Date.now()}`,
        title: title.trim(),
        url: url.trim(),
        channel: channel?.trim() || "YouTube",
        description: description?.trim() || ""
      };

      currentList.push(newResource);
      await fs.writeFile(youtubePath, JSON.stringify(currentList, null, 2));

      await execAsync("npm run manifest");

      return NextResponse.json({
        success: true,
        message: "YouTube link added successfully",
        resource: newResource
      });
    }

    // 4. UPDATE / MODIFY SUBJECT
    if (action === "update_subject") {
      const { subjectSlug, name, code, altName, description, branches } = body;
      if (!subjectSlug || !name) {
        return NextResponse.json({ error: "Subject slug and name are required" }, { status: 400 });
      }

      const subjectPath = path.join(libraryDir, subjectSlug);
      const subjectJsonPath = path.join(subjectPath, "subject.json");

      let currentData: any = {};
      try {
        currentData = JSON.parse(await fs.readFile(subjectJsonPath, "utf8"));
      } catch {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }

      currentData.name = name.trim();
      if (code) currentData.code = code.trim().toUpperCase();
      if (altName !== undefined) currentData.altName = altName.trim();
      if (description !== undefined) currentData.description = description.trim();
      if (branches && Array.isArray(branches) && branches.length > 0) {
        currentData.branches = branches;
      }

      await fs.writeFile(subjectJsonPath, JSON.stringify(currentData, null, 2));
      await execAsync("npm run manifest");

      return NextResponse.json({
        success: true,
        message: "Subject updated successfully",
        subject: currentData
      });
    }

    // 5. UPDATE SYLLABUS
    if (action === "update_syllabus") {
      const { subjectSlug, syllabus } = body;
      if (!subjectSlug || !syllabus) {
        return NextResponse.json({ error: "Subject slug and syllabus data required" }, { status: 400 });
      }

      const subjectPath = path.join(libraryDir, subjectSlug);
      await fs.mkdir(subjectPath, { recursive: true });
      const syllabusPath = path.join(subjectPath, "syllabus.json");

      await fs.writeFile(syllabusPath, JSON.stringify(syllabus, null, 2));
      await execAsync("npm run manifest");

      return NextResponse.json({
        success: true,
        message: "Syllabus updated successfully"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("API Error in /api/create:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
