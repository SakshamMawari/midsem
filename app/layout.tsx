import type { Metadata } from "next";
import LibraryShell from "@/components/LibraryShell";
import "./globals.css";

const indexable = process.env.SITE_INDEXABLE === "true";

export const metadata: Metadata = {
  title: { default: "Study Library", template: "%s | Study Library" },
  description: "A simple, searchable library for study PDFs.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { title: "Study Library", description: "A simple, searchable library for study PDFs.", type: "website" },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LibraryShell>{children}</LibraryShell>
      </body>
    </html>
  );
}
