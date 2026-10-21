-- ==============================================================================
-- Supabase Schema & Storage Configuration for Academic PDF Study Library
-- ==============================================================================
-- Project: IIIT Sonepat Midsem Digital Study Library
-- Target Deploy: Vercel + Supabase
--
-- Instructions:
-- Run this script in the Supabase Dashboard SQL Editor (or via Supabase CLI).
-- It creates the `documents` table, triggers, indexes, Row Level Security (RLS)
-- policies, and configures the `academic-pdfs` storage bucket with security policies.
-- ==============================================================================

-- 1. Create documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) > 0),
  category TEXT NOT NULL CHECK (category IN ('syllabus', 'notes', 'timetable')),
  file_path TEXT NOT NULL UNIQUE CHECK (char_length(trim(file_path)) > 0),
  file_name TEXT NOT NULL CHECK (char_length(trim(file_name)) > 0),
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_documents_subject ON public.documents(subject);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_subject_category ON public.documents(subject, category);

-- 4. Enable Row Level Security (RLS) on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public read access for documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can delete documents" ON public.documents;

-- Read policy: Anyone (anon and authenticated students) can read documents
CREATE POLICY "Public read access for documents"
ON public.documents
FOR SELECT
TO anon, authenticated
USING (true);

-- Insert policy: Authenticated users or server-side service_role can insert documents
CREATE POLICY "Authenticated and service role can insert documents"
ON public.documents
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Update policy: Authenticated users or server-side service_role can update documents
CREATE POLICY "Authenticated and service role can update documents"
ON public.documents
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Delete policy: Authenticated users or server-side service_role can delete documents
CREATE POLICY "Authenticated and service role can delete documents"
ON public.documents
FOR DELETE
TO authenticated, service_role
USING (true);

-- ==============================================================================
-- Storage Bucket: academic-pdfs
-- ==============================================================================

-- 5. Create academic-pdfs Storage Bucket (Public Read, 100MB limit, PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academic-pdfs',
  'academic-pdfs',
  true,
  104857600, -- 100 MB in bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf'];

-- 6. Storage Objects RLS Policies
DROP POLICY IF EXISTS "Public read access to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted upload to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted update to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted delete from academic-pdfs" ON storage.objects;

-- Read: Anyone can read/download public PDFs from academic-pdfs
CREATE POLICY "Public read access to academic-pdfs"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'academic-pdfs');

-- Upload: Authenticated users or server-side service_role only, with PDF extension check
CREATE POLICY "Restricted upload to academic-pdfs"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'academic-pdfs'
  AND (storage.extension(name) = 'pdf' OR storage.extension(name) = 'PDF')
);

-- Update: Authenticated users or server-side service_role only
CREATE POLICY "Restricted update to academic-pdfs"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'academic-pdfs')
WITH CHECK (bucket_id = 'academic-pdfs');

-- Delete: Authenticated users or server-side service_role only
CREATE POLICY "Restricted delete from academic-pdfs"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'academic-pdfs');
