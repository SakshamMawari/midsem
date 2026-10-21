import Header from "@/components/Header";

export default function LibraryShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div>
          <span>Study Library</span> · Minimal, fast, and static-first digital library.
        </div>
        <div>
          <span>Branches: DSA · CSE · AI & IT</span>
        </div>
      </footer>
    </>
  );
}
