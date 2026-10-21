import type { Metadata } from "next";
import AcademicPdfHub from "@/components/AcademicPdfHub";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Academic PDF Documents & Storage",
  description: "Browse, preview, and download cloud-hosted syllabus, lecture notes, and midsem timetables."
};

export default function DocumentsPage() {
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Academic PDFs" }
        ]}
      />
      <AcademicPdfHub />
    </div>
  );
}
