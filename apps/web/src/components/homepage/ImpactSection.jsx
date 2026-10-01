import { Package, HeartHandshake, TimerOff, Leaf } from "lucide-react";

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-5 text-3xl font-extrabold text-[color:var(--color-rescue-text)]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[color:var(--color-rescue-text-muted)]">{label}</p>
    </div>
  );
}

const IMPACT_STATS = [
  {
    icon: <Package size={24} className="text-[#0F9F76]" />,
    label: "Active Rescues",
    key: "active_rescues",
    accent: "bg-[color:var(--color-rescue-accent-soft)]",
  },
  {
    icon: <HeartHandshake size={24} className="text-blue-600" />,
    label: "Human Food",
    key: "human_food",
    accent: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: <TimerOff size={24} className="text-amber-600" />,
    label: "Expiring Soon",
    key: "expiring_soon",
    accent: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: <Leaf size={24} className="text-emerald-600" />,
    label: "Animal Shelters",
    key: "animal_shelters",
    accent: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

export default function ImpactSection({ stats, loading, error, onRetry }) {
  return (
    <section className="mt-20">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 bg-[color:var(--color-rescue-accent-soft)] text-[#0F9F76] text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider">
          Our Impact
        </span>
        <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight mt-4">
          Our Impact Right Now
        </h2>
        <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-2 max-w-2xl mx-auto">
          Community-powered food rescue impact across Dhaka.
        </p>
        {error && (
          <p role="status" className="mt-2 text-sm text-rose-600 dark:text-rose-300">
            Live impact data is unavailable. <button onClick={onRetry} className="font-bold underline">Try again</button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {IMPACT_STATS.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={loading ? "..." : error || !Number.isFinite(Number(stats?.[stat.key]))
              ? "—"
              : Number(stats[stat.key]).toLocaleString()}
            accent={stat.accent}
          />
        ))}
      </div>
    </section>
  );
}
