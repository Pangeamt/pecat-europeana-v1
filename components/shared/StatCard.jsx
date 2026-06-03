const STAT_THEMES = {
  slate: {
    card: "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60",
    iconWrap: "bg-slate-100 text-slate-600 ring-slate-200/70",
    value: "text-slate-900",
    label: "text-slate-500",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-200/50",
    iconWrap: "bg-violet-100 text-violet-600 ring-violet-200/70",
    value: "text-violet-700",
    label: "text-violet-600/80",
  },
  purple: {
    card: "border-purple-200/80 bg-gradient-to-br from-purple-50/90 to-white hover:border-purple-300 hover:shadow-md hover:shadow-purple-200/50",
    iconWrap: "bg-purple-100 text-purple-600 ring-purple-200/70",
    value: "text-purple-700",
    label: "text-purple-600/80",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-200/50",
    iconWrap: "bg-emerald-100 text-emerald-600 ring-emerald-200/70",
    value: "text-emerald-700",
    label: "text-emerald-600/80",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-white hover:border-sky-300 hover:shadow-md hover:shadow-sky-200/50",
    iconWrap: "bg-sky-100 text-sky-600 ring-sky-200/70",
    value: "text-sky-700",
    label: "text-sky-600/80",
  },
};

const BADGE_TONES = {
  danger: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-600",
};

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  theme = "slate",
  iconSpin = false,
  compactValue = false,
  badges = [],
}) => {
  const styles = STAT_THEMES[theme] ?? STAT_THEMES.slate;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 motion-reduce:transition-none ${styles.card}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/40 blur-2xl transition-opacity duration-200 group-hover:opacity-80"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`m-0 text-[11px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}
          >
            {label}
          </p>
          <p
            className={`mt-2 font-semibold leading-none ${compactValue ? "truncate text-sm" : "text-3xl tabular-nums"} ${styles.value}`}
            title={compactValue && typeof value === "string" ? value : undefined}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          ) : null}
          {badges.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.map(({ label: badgeLabel, tone = "neutral" }) => (
                <span
                  key={badgeLabel}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_TONES[tone] ?? BADGE_TONES.neutral}`}
                >
                  {badgeLabel}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.iconWrap}`}
        >
          <Icon
            size={20}
            strokeWidth={2}
            className={iconSpin ? "animate-spin motion-reduce:animate-none" : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export const StatCardGrid = ({
  children,
  columns = 4,
  ariaLabel = "Statistics",
}) => {
  const columnClass =
    columns === 3
      ? "sm:grid-cols-2 xl:grid-cols-3"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div
      className={`mb-4 grid grid-cols-1 gap-3 ${columnClass}`}
      role="region"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};
