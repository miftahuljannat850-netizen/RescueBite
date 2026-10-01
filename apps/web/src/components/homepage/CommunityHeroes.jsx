import { Star, Bike, MapPin, Package } from "lucide-react";

const ICONS = [<Bike size={15} />, <Package size={15} />, <MapPin size={15} />, <Star size={15} />];

export default function CommunityHeroes({ volunteers = [], loading = false, error = false }) {
  return (
    <section className="mt-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 bg-[color:var(--color-rescue-accent-soft)] text-[#0F9F76] text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider">
          <Star size={14} />
          Community Heroes
        </span>
        <h2 className="text-3xl font-extrabold text-[color:var(--color-rescue-text)] tracking-tight mt-4">
          Top Rescue Volunteers
        </h2>
        <p className="text-[color:var(--color-rescue-text-muted)] font-medium text-sm mt-2 max-w-2xl mx-auto">
          These volunteers power RescueBite’s last-mile delivery. Their local
          knowledge and dedication turn surplus food into meals for families.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {volunteers.map((hero, index) => (
          <div
            key={hero.id}
            className="rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-6 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative mb-4 flex items-end justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0F9F76]/20 bg-[color:var(--color-rescue-accent-soft)] font-black text-[#0F9F76]">
                {hero.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0F9F76] text-white">
                {ICONS[index % ICONS.length]}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[color:var(--color-rescue-text)]">{hero.name}</h3>
            <p className="mt-1 text-xs text-[color:var(--color-rescue-text-muted)]">
              Volunteer{hero.service_area ? ` • ${hero.service_area}` : ''}
            </p>

            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#0F9F76]/10 px-3 py-1.5 text-xs font-bold text-[#0F9F76]">
              <Star size={12} /> {index === 0 ? 'Top Volunteer' : 'Community Volunteer'}
            </div>

            <p className="mt-4 text-sm font-semibold text-[color:var(--color-rescue-text-muted)]">
              {hero.completed_deliveries} completed rescues
            </p>
          </div>
        ))}
      </div>

      {!loading && volunteers.length === 0 && (
        <p className="text-center text-sm text-[color:var(--color-rescue-text-muted)]">
          {error ? 'Volunteer delivery data is unavailable.' : 'Completed volunteer deliveries will appear here.'}
        </p>
      )}

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => alert("Volunteer registration flow coming soon.")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F9F76] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-md shadow-[#0F9F76]/25 transition hover:bg-[#0C8562] active:scale-95"
        >
          <Star size={16} /> Become a Community Hero
        </button>
      </div>
    </section>
  );
}
