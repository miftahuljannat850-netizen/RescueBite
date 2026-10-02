import {
  Bell,
  Search as SearchIcon,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  User,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { clearSession } from "../../lib/auth";

const donorMenu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/donor/dashboard" },
  {
    title: "Create Donation",
    icon: PlusCircle,
    path: "/donor/create-donation",
  },
  { title: "My Donations", icon: Package, path: "/donor/my-donations" },
  { title: "Notifications", icon: Bell, path: "/donor/notifications" },
  { title: "Profile", icon: User, path: "/donor/profile" },
  { title: "Settings", icon: Settings, path: "/donor/settings" },
];

const ngoMenu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/ngo/dashboard" },
  {
    title: "Browse Food Donations",
    icon: SearchIcon,
    path: "/ngo/browse-food",
  },
  { title: "My Requests", icon: Package, path: "/ngo/requests" },
  { title: "Notifications", icon: Bell, path: "/ngo/notifications" },
  { title: "Profile", icon: User, path: "/ngo/profile" },
  { title: "Settings", icon: Settings, path: "/ngo/settings" },
];
const volunteerMenu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/volunteer/dashboard",
  },
  {
    title: "Pickup Tasks",
    icon: Package,
    path: "/volunteer/dashboard#pickup-tasks",
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/volunteer/notifications",
  },
  {
    title: "Profile",
    icon: User,
    path: "/volunteer/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/volunteer/settings",
  },
];

const menusByRole = {
  donor: donorMenu,
  ngo: ngoMenu,
  volunteer: volunteerMenu,
};

const dashboardLabels = {
  donor: "Donor Dashboard",
  ngo: "NGO Dashboard",
  volunteer: "Volunteer Dashboard",
};

export default function Sidebar({ isOpen, setIsOpen, role = "donor" }) {
  const navigate = useNavigate();
  const menuItems = menusByRole[role] || [];

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clear the local session even if the API is unavailable.
    } finally {
      clearSession();
      navigate("/login");
    }
  };

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[color:var(--color-rescue-surface)] border-r border-[color:var(--color-rescue-border)] shadow-sm flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="border-b border-[color:var(--color-rescue-border)] px-6 py-6">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg"
            >
              <img
                src={`${import.meta.env.BASE_URL}rescuebite-icon.svg`}
                alt="RescueBite"
                className="h-11 w-auto"
              />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-[#0F9F76]">RescueBite</h1>
                <p className="text-xs text-[color:var(--color-rescue-text-muted)]">
                  {dashboardLabels[role] || "Dashboard"}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto lg:hidden"
              aria-label="Close Sidebar"
            >
              <X size={22} className="text-[color:var(--color-rescue-text)]" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            if (
              item.title === "Pickup Tasks" &&
              item.path.includes("#pickup-tasks")
            ) {
              return (
                <a
                  key={item.title}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl font-medium text-[color:var(--color-rescue-text)] transition-all duration-200 hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <Icon size={20} />
                  <span>{item.title}</span>
                </a>
              );
            }

            return (
              <NavLink
                key={item.title}
                to={item.path}
                end={item.path === "/volunteer/dashboard"}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 ${isActive ? "bg-[#0F9F76] text-white shadow" : "text-[color:var(--color-rescue-text)] hover:bg-[color:var(--color-rescue-accent-soft)] hover:text-[#0F9F76]"}`
                }
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[color:var(--color-rescue-border)] p-5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
