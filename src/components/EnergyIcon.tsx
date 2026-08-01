import { getEnergyIconSource } from "@/lib/energyIcons";

interface EnergyIconProps {
  type: string;
  size?: number;
  className?: string;
}

export function EnergyIcon({ type, size = 20, className = "" }: EnergyIconProps) {
  const src = getEnergyIconSource(type);
  if (src) {
    return (
      <img
        src={src}
        alt={type}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        title={type}
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[10px] font-semibold text-[var(--color-text-muted)] ${className}`}
      style={{ width: size, height: size }}
      title={type}
    >
      {type.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function EnergyIconRow({
  types,
  size = 20,
}: {
  types: string[];
  size?: number;
}) {
  if (!types.length) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {types.map((t, i) => (
        <EnergyIcon key={`${t}-${i}`} type={t} size={size} />
      ))}
    </span>
  );
}
