-- Migration: 20261021_initial_schema.sql
-- Create documents table and academic-pdfs bucket policies

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

CREATE INDEX IF NOT EXISTS idx_documents_subject ON public.documents(subject);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_subject_category ON public.documents(subject, category);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated and service role can delete documents" ON public.documents;

CREATE POLICY "Public read access for documents"
ON public.documents
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated and service role can insert documents"
ON public.documents
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Authenticated and service role can update documents"
ON public.documents
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated and service role can delete documents"
ON public.documents
FOR DELETE
TO authenticated, service_role
USING (true);

-- Storage configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academic-pdfs',
  'academic-pdfs',
  true,
  104857600,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Public read access to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted upload to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted update to academic-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Restricted delete from academic-pdfs" ON storage.objects;

CREATE POLICY "Public read access to academic-pdfs"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'academic-pdfs');

CREATE POLICY "Restricted upload to academic-pdfs"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'academic-pdfs'
  AND (storage.extension(name) = 'pdf' OR storage.extension(name) = 'PDF')
);

CREATE POLICY "Restricted update to academic-pdfs"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'academic-pdfs')
WITH CHECK (bucket_id = 'academic-pdfs');

CREATE POLICY "Restricted delete from academic-pdfs"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'academic-pdfs');
