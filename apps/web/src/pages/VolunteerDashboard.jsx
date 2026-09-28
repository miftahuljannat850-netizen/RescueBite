import { Bike, Clock3, LoaderCircle, MapPin, PackageCheck, SearchX, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import HeroCollage from "../components/dashboard/HeroCollage";
import SummaryCard from "../components/dashboard/SummaryCard";
import { api } from "../api/client";

const statusClasses = {
  available: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  assigned: "bg-amber-100 text-amber-700 ring-amber-600/20",
  completed: "bg-sky-100 text-sky-700 ring-sky-600/20",
};

export default function VolunteerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshTasks = useCallback(async () => {
    return api.getVolunteerTasks();
  }, []);

  useEffect(() => {
    refreshTasks()
      .then((response) => setTasks(response.data || []))
      .catch((requestError) => setError(requestError.message || "Unable to load pickup tasks."))
      .finally(() => setLoading(false));
  }, [refreshTasks]);

  async function updateTask(task, nextStatus) {
    try {
      const response = task.status === "available"
        ? await api.acceptPickup(task.id)
        : await api.updatePickup(task.id, nextStatus);
      setTasks((current) => current.map((item) => item.id === task.id ? response.task : item));
      const refreshed = await refreshTasks();
      setTasks(refreshed.data || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to update pickup task.");
    }
  }

  const summary = useMemo(() => {
    if (tasks.length === 0) {
      return {
        available: "—",
        assigned: "—",
        completed: "—",
        total: "—",
      };
    }

    const available = tasks.filter(
      (task) => task.status === "available",
    ).length;
    const assigned = tasks.filter((task) => task.status === "assigned").length;
    const completed = tasks.filter(
      (task) => task.status === "completed",
    ).length;

    return {
      available: String(available),
      assigned: String(assigned),
      completed: String(completed),
      total: String(tasks.length),
    };
  }, [tasks]);

  return (
    <DashboardShell role="volunteer">
      <div className="space-y-6">
        <HeroCollage role="volunteer" />

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Available Tasks"
            value={summary.available}
            subtitle="Ready to pick up"
            trend="Live"
            color="emerald"
            icon={<Bike size={22} />}
          />
          <SummaryCard
            title="Assigned Tasks"
            value={summary.assigned}
            subtitle="On the route"
            trend="Today"
            color="blue"
            icon={<Truck size={22} />}
          />
          <SummaryCard
            title="Completed Tasks"
            value={summary.completed}
            subtitle="Delivered"
            trend="This week"
            color="violet"
            icon={<PackageCheck size={22} />}
          />
          <SummaryCard
            title="Total Deliveries"
            value={summary.total}
            subtitle="Active queue"
            trend="View"
            color="orange"
            icon={<Clock3 size={22} />}
          />
        </section>

        <section
          id="pickup-tasks"
          className="mt-10 rounded-[2rem] border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-5 shadow-sm md:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0F9F76]">
                Pickup Tasks
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[color:var(--color-rescue-text)]">
                Pickup Tasks
              </h2>
              <p className="mt-1 text-sm text-[color:var(--color-rescue-text-muted)]">
                Available and assigned food rescue opportunities.
              </p>
            </div>
            <p className="text-sm text-[color:var(--color-rescue-text-muted)]">
              {tasks.length > 0 ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}` : "No active tasks"}
            </p>
          </div>

          {error && <p className="mb-5 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{error}</p>}
          {loading && <LoaderCircle className="mx-auto animate-spin text-[#0F9F76]" />}
          {!loading && tasks.length === 0 && (
            <div className="mt-6 rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-bg)] p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F9F76]/10 text-[#0F9F76]">
                <SearchX className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-[color:var(--color-rescue-text)]">
                No Pickup Tasks Available
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-rescue-text-muted)]">
                Volunteer pickup opportunities will appear here when available.
              </p>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => (
                <VolunteerTaskCard key={task.id} task={task} onUpdate={updateTask} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function VolunteerTaskCard({ task, onUpdate }) {
  const statusLabel = task.status === "completed"
    ? "Completed / Delivered"
    : task.status.charAt(0).toUpperCase() + task.status.slice(1);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-bg)] shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F9F76]">
            {task.id}
          </p>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--color-rescue-text)]">
            {task.food || "Pickup task"}
          </h3>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusClasses[task.status] ?? "bg-gray-100 text-gray-700 ring-gray-300"}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 rounded-2xl bg-[color:var(--color-rescue-surface)] p-3 text-sm text-[color:var(--color-rescue-text)]">
          <p className="font-semibold">Food</p>
          <p className="mt-1 text-[color:var(--color-rescue-text-muted)]">
            {task.food}
          </p>
        </div>

        <div className="space-y-3 text-sm text-[color:var(--color-rescue-text)]">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 text-[#0F9F76]" />
            <div>
              <p className="font-semibold">Pickup</p>
              <p className="text-[color:var(--color-rescue-text-muted)]">
                {task.pickup_location}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck size={16} className="mt-0.5 text-[#0F9F76]" />
            <div>
              <p className="font-semibold">Destination</p>
              <p className="text-[color:var(--color-rescue-text-muted)]">
                {task.destination || "NGO recipient"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Bike size={16} className="text-[#0F9F76]" />
            <span className="text-[color:var(--color-rescue-text-muted)]">
              {task.quantity}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock3 size={16} className="text-[#0F9F76]" />
            <span className="text-[color:var(--color-rescue-text-muted)]">
              {task.status === "available" ? "Ready for acceptance" : task.status}
            </span>
          </div>
        </div>
        <div className="mt-5">
          {task.status === "available" && <button onClick={() => onUpdate(task, "accepted")} className="w-full rounded-xl bg-[#0F9F76] px-4 py-3 text-sm font-bold text-white">Accept Pickup</button>}
          {task.status === "accepted" && <button onClick={() => onUpdate(task, "en_route")} className="w-full rounded-xl bg-[#0F9F76] px-4 py-3 text-sm font-bold text-white">Start Route</button>}
          {task.status === "en_route" && <button onClick={() => onUpdate(task, "picked_up")} className="w-full rounded-xl bg-[#0F9F76] px-4 py-3 text-sm font-bold text-white">Mark Picked Up</button>}
          {task.status === "picked_up" && <button onClick={() => onUpdate(task, "delivered")} className="w-full rounded-xl bg-[#0F9F76] px-4 py-3 text-sm font-bold text-white">Mark Delivered</button>}
        </div>
      </div>
    </article>
  );
}
