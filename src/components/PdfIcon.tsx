import type { SVGProps } from "react";

interface PdfIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export default function PdfIcon({ size = 20, className = "", ...props }: PdfIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pdf-icon ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Document outline */}
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        className="text-zinc-600"
        stroke="#3F3F46"
        fill="#18181B"
      />
      {/* Folded corner */}
      <polyline points="14 2 14 8 20 8" stroke="#52525B" fill="#27272A" />
      {/* Restrained Red Accent badge for PDF */}
      <rect x="6.5" y="12" width="11" height="6.5" rx="1.5" fill="#EF4444" fillOpacity="0.16" stroke="#EF4444" strokeWidth="1" />
      <text
        x="12"
        y="16.5"
        fill="#EF4444"
        fontSize="5"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        stroke="none"
      >
        PDF
      </text>
    </svg>
  );
}
