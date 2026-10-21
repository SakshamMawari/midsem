import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { getPublicStorageUrl } from "@/lib/supabase/client";
import { subjects } from "@/lib/library";
import type { DatabaseDocument, DocumentCategory } from "@/lib/supabase/types";

const MAX_FILE_SIZE = 104857600; // 100 MB
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";
const REQUIRED_ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * GET /api/documents
 * Query params: ?subject=...&category=...&search=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectParam = searchParams.get("subject")?.trim();
    const categoryParam = searchParams.get("category")?.trim() as DocumentCategory | undefined;
    const searchParam = searchParams.get("search")?.trim().toLowerCase();

    // 1. If Supabase is configured, fetch from PostgreSQL database
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseServerClient() || getSupabaseAdminClient();
      if (supabase) {
        let query = supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false });

        if (subjectParam && subjectParam !== "ALL") {
          query = query.ilike("subject", subjectParam);
        }

        if (categoryParam && ["syllabus", "notes", "timetable"].includes(categoryParam)) {
          query = query.eq("category", categoryParam);
        }

        if (searchParam) {
          query = query.or(`title.ilike.%${searchParam}%,description.ilike.%${searchParam}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("Supabase documents table query returned error (falling back to local):", error.message);
        } else if (data) {
          const documents: DatabaseDocument[] = data.map((doc: any) => ({
            ...doc,
            public_url: getPublicStorageUrl(doc.file_path)
          }));

          return NextResponse.json({
            source: "supabase",
            count: documents.length,
            documents
          });
        }
      }
    }

    // 2. Fallback to local manifest when Supabase is not yet connected
    const fallbackDocs: DatabaseDocument[] = [];

    for (const sub of subjects) {
      if (subjectParam && subjectParam !== "ALL" && sub.name !== subjectParam && sub.slug !== subjectParam) {
        continue;
      }

      // Add timetable if subject has it
      if (!categoryParam || categoryParam === "timetable") {
        fallbackDocs.push({
          id: `local-tt-${sub.slug}`,
          title: `${sub.name} - Official Midsem Examination Schedule`,
          description: `Exam on ${sub.examDate || "Scheduled"} (${sub.examTime || "02:00 PM – 04:00 PM"}).`,
          subject: sub.name,
          category: "timetable",
          file_path: "/Timetable.jpeg",
          file_name: "Timetable.jpeg",
          file_size: 105179,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          public_url: "/Timetable.jpeg"
        });
      }

      // Add syllabus documents
      if (sub.syllabus && (!categoryParam || categoryParam === "syllabus")) {
        fallbackDocs.push({
          id: `local-syl-${sub.slug}`,
          title: `${sub.name} - Official Course Syllabus & Outline`,
          description: `Units, topics, and reference textbooks for ${sub.code}.`,
          subject: sub.name,
          category: "syllabus",
          file_path: `/library/${sub.slug}/syllabus.json`,
          file_name: "syllabus.json",
          file_size: 2048,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          public_url: `/${sub.slug}`
        });
      }

      // Add notes from units
      if (!categoryParam || categoryParam === "notes") {
        for (const unit of sub.units) {
          for (const f of unit.files) {
            fallbackDocs.push({
              id: `local-note-${sub.slug}-${f.slug}`,
              title: f.title || f.name,
              description: f.description || `${sub.name} - ${unit.name}`,
              subject: sub.name,
              category: "notes",
              file_path: f.path || f.url || "",
              file_name: `${f.name}.pdf`,
              file_size: Math.round(f.sizeMb * 1024 * 1024),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              public_url: f.url || f.path
            });
          }
        }
      }
    }

    const filtered = fallbackDocs.filter((doc) => {
      if (!searchParam) return true;
      return (
        doc.title.toLowerCase().includes(searchParam) ||
        (doc.description && doc.description.toLowerCase().includes(searchParam))
      );
    });

    return NextResponse.json({
      source: "local-fallback",
      count: filtered.length,
      documents: filtered
    });
  } catch (err: any) {
    console.error("GET /api/documents error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch documents" }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Upload PDF and create record in Supabase
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() as DocumentCategory;
    const description = (formData.get("description") as string)?.trim() || null;
    const adminKey = (formData.get("adminKey") as string)?.trim();

    // 1. Authorization check
    if (REQUIRED_ADMIN_KEY && adminKey !== REQUIRED_ADMIN_KEY) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing administrator passcode." },
        { status: 401 }
      );
    }

    // 2. Validation
    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!["syllabus", "notes", "timetable"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'syllabus', 'notes', or 'timetable'." },
        { status: 400 }
      );
    }

    // MIME type and extension validation
    const isPdfMime = file.type === "application/pdf" || file.type === "application/x-pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 100 MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)} MB.` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase backend is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to environment variables."
        },
        { status: 503 }
      );
    }

    // 3. Storage Upload
    const originalName = file.name || "document.pdf";
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${category}/${slugify(subject)}/${Date.now()}-${cleanFileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 4. Database Insert
    const { data: insertedDoc, error: dbError } = await supabase
      .from("documents")
      .insert({
        title,
        description,
        subject,
        category,
        file_path: storagePath,
        file_name: originalName,
        file_size: file.size
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase database insert error:", dbError);
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return NextResponse.json(
        { error: `Database insert failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    const publicUrl = getPublicStorageUrl(storagePath);

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully to Supabase.",
      document: {
        ...insertedDoc,
        public_url: publicUrl
      }
    });
  } catch (err: any) {
    console.error("POST /api/documents error:", err);
    return NextResponse.json({ error: err.message || "Failed to process upload" }, { status: 500 });
  }
}

/**
 * DELETE /api/documents
 * Delete document from database and storage
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, filePath, adminKey } = body;

    if (REQUIRED_ADMIN_KEY && adminKey !== REQUIRED_ADMIN_KEY) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing administrator passcode." },
        { status: 401 }
      );
    }

    if (!id && !filePath) {
      return NextResponse.json({ error: "Document ID or file path required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase backend not configured" }, { status: 503 });
    }

    // If filePath is known, delete from storage
    if (filePath) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    // Delete record from documents table
    if (id) {
      const { error: dbError } = await supabase.from("documents").delete().eq("id", id);
      if (dbError) throw dbError;
    } else if (filePath) {
      const { error: dbError } = await supabase.from("documents").delete().eq("file_path", filePath);
      if (dbError) throw dbError;
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (err: any) {
    console.error("DELETE /api/documents error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete document" }, { status: 500 });
  }
}
