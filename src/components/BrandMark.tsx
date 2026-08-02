interface BrandMarkProps {
  className?: string;
  label?: string;
}

export function BrandMark({
  className = "h-10 w-10",
  label = "Pokébola",
}: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="32" cy="32" r="28" fill="#F5F5F5" />
      <path d="M4 32A28 28 0 0 1 60 32Z" fill="#EE1515" />
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="4"
      />
      <rect x="4" y="29" width="56" height="6" fill="#1A1A1A" />
      <circle cx="32" cy="32" r="9" fill="#1A1A1A" />
      <circle cx="32" cy="32" r="5.5" fill="#F5F5F5" />
      <circle cx="32" cy="32" r="2.5" fill="#1A1A1A" />
    </svg>
  );
}
