import { cn } from "@/shared/utils";

// Monograma NL com o corte diagonal de assinatura.
export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        aria-hidden
        className="clip-tag flex h-10 w-10 items-center justify-center border border-lime/40 bg-ink"
      >
        <span className="display text-2xl leading-none">
          <span className="text-white">N</span>
          <span className="text-lime">L</span>
        </span>
      </div>
      {withWordmark && (
        <div className="leading-none">
          <span className="display block text-xl text-foreground">
            NUTRI<span className="text-lime">LAB</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Brasil
          </span>
        </div>
      )}
    </div>
  );
}
