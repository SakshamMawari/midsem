export type DocumentCategory = "syllabus" | "notes" | "timetable";

export interface DatabaseDocument {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  public_url?: string;
}

export interface DocumentInsertInput {
  title: string;
  description?: string | null;
  subject: string;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  file_size: number;
}
