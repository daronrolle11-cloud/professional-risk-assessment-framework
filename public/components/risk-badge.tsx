import Image from "next/image";
import { levelOf, RISK_LEVELS, scoreOf, cellStyle } from "@/lib/risk";
import type { RiskLevelKey } from "@/lib/types";

export function LevelBadge({ score, paper = false, size = "md" }: { score: number; paper?: boolean; size?: "sm" | "md" }) {
  const level = levelOf(score);
  const cls = paper ? level.paperChip : level.darkChip;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`mono inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wider ${pad} ${cls}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: level.hex }} />
      {score} · {level.label}
    </span>
  );
}

export function LevelChipInline({ levelKey, paper = false }: { levelKey: RiskLevelKey; paper?: boolean }) {
  const level = RISK_LEVELS[levelKey];
  const cls = paper ? level.paperChip : level.darkChip;
  return (
    <span className={`mono inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {level.min}–{level.max} {level.label}
    </span>
  );
}

/** Compact 5×5 matrix used in the wizard; axes labels small. */
export function MiniMatrix({ likelihood, severity }: { likelihood: number; severity: number }) {
  return (
    <div className="inline-grid grid-cols-5 gap-[3px] rounded-lg border border-white/10 bg-black/40 p-2">
      {[5, 4, 3, 2, 1].map((s) =>
        [1, 2, 3, 4, 5].map((l) => {
          const active = l === likelihood && s === severity;
          return (
            <div
              key={`${l}-${s}`}
              className="flex h-5 w-5 items-center justify-center rounded-[3px] text-[9px] mono font-bold transition-transform"
              style={{ ...cellStyle(l, s, active ? 1 : 0.32), transform: active ? "scale(1.15)" : undefined, outline: active ? "2px solid #fff" : undefined, outlineOffset: 1 }}
            >
              {scoreOf(l, s)}
            </div>
          );
        })
      )}
    </div>
  );
}

/** Interactive 5×5 selector. */
export function MatrixPicker({
  likelihood,
  severity,
  onPick,
  paper = false,
}: {
  likelihood: number;
  severity: number;
  onPick: (l: number, s: number) => void;
  paper?: boolean;
}) {
  const border = paper ? "border-black/15 bg-black/[0.03]" : "border-white/10 bg-black/40";
  const axisCls = paper ? "text-black/50" : "text-white/40";
  return (
    <div className={`inline-block rounded-xl border p-3 ${border}`}>
      <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1">
        <div />
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={l} className={`mono flex h-9 items-center justify-center text-[10px] font-bold ${axisCls}`}>{l}</div>
        ))}
        {[5, 4, 3, 2, 1].map((s) => (
          <MatrixRow key={s} s={s} likelihood={likelihood} severity={severity} onPick={onPick} axisCls={axisCls} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className={`mono text-[9px] uppercase tracking-[0.2em] ${axisCls}`}>Severity ↑</span>
        <span className={`mono text-[9px] uppercase tracking-[0.2em] ${axisCls}`}>Likelihood →</span>
      </div>
    </div>
  );
}

function MatrixRow({ s, likelihood, severity, onPick, axisCls }: { s: number; likelihood: number; severity: number; onPick: (l: number, s: number) => void; axisCls: string }) {
  return (
    <>
      <div className={`mono flex w-8 items-center justify-center text-[10px] font-bold ${axisCls}`}>{s}</div>
      {[1, 2, 3, 4, 5].map((l) => {
        const active = l === likelihood && s === severity;
        return (
          <button
            key={l}
            type="button"
            title={`L${l} × S${s} = ${l * s}`}
            onClick={() => onPick(l, s)}
            className="flex h-9 w-9 items-center justify-center rounded-[5px] text-[11px] mono font-bold transition-all hover:scale-110"
            style={{ ...cellStyle(l, s, active ? 1 : 0.38), outline: active ? "2px solid #fff" : undefined, outlineOffset: 1 }}
          >
            {l * s}
          </button>
        );
      })}
    </>
  );
}

export function BrandMark({ className = "h-8 w-8", plate = false }: { className?: string; plate?: boolean }) {
  return (
    <span className={`relative inline-flex items-center justify-center overflow-hidden ${plate ? "rounded-xl p-1.5 bcso-logo-plate" : ""}`}>
      <Image src="/brand/bcso-icon.svg" alt="BCSO icon" width={80} height={80} className={className} priority />
    </span>
  );
}

export function BrandLogo({ className = "h-10 w-auto", plate = false, src }: { className?: string; plate?: boolean; src?: string | null }) {
  return (
    <span className={`relative inline-flex items-center justify-center overflow-hidden ${plate ? "rounded-2xl px-3 py-2 bcso-logo-plate" : ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Company Logo" className={className} style={{ objectFit: 'contain' }} />
      ) : (
        <Image src="/brand/bcso-logo.svg" alt="BCSO — Bahamas Compliance & Safety Oversight Ltd." width={1180} height={360} className={className} priority />
      )}
    </span>
  );
}
