import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span className="breadcrumb-item" key={`${crumb.label}-${index}`}>
            {index > 0 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                /
              </span>
            )}
            {crumb.href && !isLast ? (
              <Link href={crumb.href}>{crumb.label}</Link>
            ) : (
              <span className="breadcrumb-current" aria-current="page">
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
