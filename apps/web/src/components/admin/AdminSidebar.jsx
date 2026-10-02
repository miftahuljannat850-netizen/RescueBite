import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, HandHeart, Users, Package, BarChart3, Activity, Flag, Settings, LogOut, X } from "lucide-react";
import { api } from "../../api/client";
import { clearSession } from "../../lib/auth";
import { Link } from "react-router-dom";

const items = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "NGO Management", path: "/admin/ngos", icon: Building2 },
  { label: "Volunteer Management", path: "/admin/volunteers", icon: HandHeart },
  { label: "Donor Management", path: "/admin/donors", icon: Users },
  { label: "Donations & Rescues", path: "/admin/donations", icon: Package },
  { label: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
  { label: "Activity Logs", path: "/admin/activity", icon: Activity },
  { label: "Reported Content", path: "/admin/reported-content", icon: Flag },
];

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      clearSession();
      navigate("/login");
      return;
    }

    clearSession();
    navigate("/login");
  };

  return (
    <>
      {open && <button aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[color:var(--color-rescue-border)] bg-[color:var(--color-rescue-surface)] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-[color:var(--color-rescue-border)] px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg">
              <img src={`${import.meta.env.BASE_URL}rescuebite-icon.svg`} alt="RescueBite" className="h-10 w-10" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-[#0F9F76]">RescueBite</h1>
              <p className="text-[11px] text-[color:var(--color-rescue-text-muted)]">Admin Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-[color:var(--color-rescue-text)]"><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-[#0F9F76] text-white shadow-sm" : "text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76]"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[color:var(--color-rescue-border)] p-3">
          <NavLink to="/admin/settings" onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)]">
            <Settings size={18} /> Settings
          </NavLink>
          <button onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
