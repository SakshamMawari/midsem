import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import manifest from "../src/data/manifest.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("your-project-ref")) {
  console.error("❌ Error: Supabase credentials are missing or placeholder in environment.");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment or .env.local file.");
  console.error("Example: NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... npx tsx scripts/migrate-to-supabase.ts");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.warn("⚠️ Could not list buckets (check RLS or permissions):", error.message);
    return;
  }
  const exists = buckets.some((b) => b.id === bucketName || b.name === bucketName);
  if (!exists) {
    console.log(`📦 Creating Supabase Storage bucket "${bucketName}"...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 104857600,
      allowedMimeTypes: ["application/pdf"]
    });
    if (createError) {
      console.warn("⚠️ Could not create bucket automatically:", createError.message);
    } else {
      console.log(`✅ Bucket "${bucketName}" created successfully.`);
    }
  } else {
    console.log(`✅ Storage bucket "${bucketName}" is ready.`);
  }
}

async function migrate() {
  console.log("🚀 Starting Safe Academic PDF Migration to Supabase...");
  console.log(`Target: ${supabaseUrl}`);
  console.log(`Storage Bucket: ${bucketName}\n`);

  await ensureBucket();

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const root = process.cwd();

  // 1. Migrate Timetable scan if exists
  const timetablePath = path.join(root, "public", "pdf", "Timetable.jpeg");
  try {
    const stat = await fs.stat(timetablePath);
    if (stat.isFile()) {
      console.log("📅 Found Timetable circular notice...");
      // For timetable notification, we record it in documents if desired
    }
  } catch {}

  // 2. Iterate all subjects in manifest
  for (const subject of manifest.subjects) {
    console.log(`\n📚 Processing Subject: [${subject.code}] ${subject.name}`);

    for (const unit of subject.units) {
      for (const doc of unit.files) {
        const localRelPath = doc.path.replace(/^\//, "");
        const localAbsPath = path.join(root, "public", decodeURIComponent(localRelPath));

        try {
          const stats = await fs.stat(localAbsPath);
          const localFileName = path.basename(decodeURIComponent(localRelPath));
          const storagePath = `notes/${subject.slug}/${unit.slug}/${localFileName}`;

          // Check if document already recorded in DB
          const { data: existing } = await supabase
            .from("documents")
            .select("id")
            .eq("file_path", storagePath)
            .maybeSingle();

          if (existing) {
            console.log(`   ⏩ Already exists in DB: ${doc.title} (${localFileName})`);
            skippedCount++;
            continue;
          }

          console.log(`   ⬆️ Uploading: ${doc.title} (${(stats.size / 1024).toFixed(0)} KB)...`);
          const fileBuffer = await fs.readFile(localAbsPath);

          const { error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileBuffer, {
              contentType: "application/pdf",
              upsert: true
            });

          if (uploadErr) {
            console.error(`   ❌ Storage upload failed for ${storagePath}:`, uploadErr.message);
            errorCount++;
            continue;
          }

          // Insert into PostgreSQL documents table
          const { error: dbErr } = await supabase.from("documents").insert({
            title: doc.title,
            description: (doc as any).description || `${subject.name} - ${unit.name}`,
            subject: subject.name,
            category: "notes",
            file_path: storagePath,
            file_name: localFileName,
            file_size: stats.size
          });

          if (dbErr) {
            console.error(`   ❌ Database insert failed for ${doc.title}:`, dbErr.message);
            errorCount++;
          } else {
            console.log(`   ✅ Migrated to Supabase: ${doc.title}`);
            uploadedCount++;
          }
        } catch (err: any) {
          console.error(`   ❌ Failed processing file ${localAbsPath}:`, err.message);
          errorCount++;
        }
      }
    }
  }

  console.log("\n========================================================");
  console.log("🎉 Migration Summary:");
  console.log(`   Total Migrated to Supabase: ${uploadedCount}`);
  console.log(`   Already Existing (Skipped):  ${skippedCount}`);
  console.log(`   Errors Encountered:          ${errorCount}`);
  console.log("========================================================\n");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
