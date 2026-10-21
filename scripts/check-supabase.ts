import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";

console.log("\n==========================================");
console.log("   🔍 SUPABASE HEALTH & STATUS CHECK");
console.log("==========================================");
console.log(`📡 Project URL : ${supabaseUrl || "MISSING"}`);
console.log(`🔑 Key Prefix  : ${supabaseKey ? supabaseKey.slice(0, 15) + "..." : "MISSING"}`);
console.log(`🪣 Target Bucket: ${bucketName}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Supabase credentials are missing in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runCheck() {
  // 1. Check Database Table
  console.log("1️⃣ Checking PostgreSQL 'documents' table...");
  try {
    const { data, count, error } = await supabase
      .from("documents")
      .select("*", { count: "exact" })
      .limit(5);

    if (error) {
      console.log(`   ⚠️ Table query response: ${error.message} (Code: ${error.code})`);
      if (error.code === "42P01") {
        console.log("   👉 Note: The 'documents' table has not been created yet in SQL Editor.");
        console.log("      Run 'supabase/schema.sql' in your Supabase SQL Editor to create it.");
      }
    } else {
      console.log(`   ✅ Database connected! 'documents' table exists.`);
      console.log(`   📊 Total document records found: ${count ?? data?.length ?? 0}`);
      if (data && data.length > 0) {
        console.log("   📄 Sample records:");
        data.forEach((doc, idx) => {
          console.log(`      [${idx + 1}] ${doc.title || doc.name} (${doc.subject || "No subject"})`);
        });
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Database check failed: ${err.message}`);
  }

  // 2. Check Storage Bucket
  console.log("\n2️⃣ Checking Supabase Storage bucket...");
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.log(`   ⚠️ List buckets error: ${bucketError.message}`);
    } else {
      console.log(`   ✅ Storage API reachable! Found ${buckets.length} buckets.`);
      const targetBucket = buckets.find((b) => b.id === bucketName || b.name === bucketName);
      if (targetBucket) {
        console.log(`   ✅ Bucket "${bucketName}" exists! (Public: ${targetBucket.public ? "Yes" : "No"})`);
      } else {
        console.log(`   ℹ️ Available buckets: ${buckets.map((b) => b.name).join(", ") || "None"}`);
      }
    }

    // Check files inside target bucket
    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 10 });

    if (filesError) {
      console.log(`   ⚠️ Files list response: ${filesError.message}`);
    } else {
      console.log(`   📦 Files in "${bucketName}" root: ${files.length} item(s)`);
      if (files.length > 0) {
        files.forEach((f) => {
          console.log(`      - ${f.name} (${f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) + " KB" : "folder/item"})`);
        });
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Storage check failed: ${err.message}`);
  }

  console.log("\n==========================================");
  console.log("   ✨ CHECK COMPLETE");
  console.log("==========================================\n");
}

runCheck();
