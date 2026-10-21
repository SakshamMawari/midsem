import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  message: string;
  actionText?: string;
  actionHref?: string;
}

export default function EmptyState({
  title = "No documents found",
  message,
  actionText,
  actionHref
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionText && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionText}
        </Link>
      )}
    </div>
  );
}
