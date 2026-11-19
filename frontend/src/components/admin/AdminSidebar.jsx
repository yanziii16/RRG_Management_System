import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  UserCheck,
  BedDouble,
  Tent,
  Sparkles,
  LifeBuoy,
  CreditCard,
  Receipt,
  Tags,
  BarChart3,
  ShieldCheck,
  Settings,
  X
} from "lucide-react";
import { useReservations } from "../../hooks/useReservations";
import { SafeImage } from "../common/SafeImage";
const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "Operations",
    items: [
      { to: "/admin/reservations", label: "Reservations", icon: CalendarCheck },
      { to: "/admin/guests", label: "Guests", icon: Users },
      { to: "/admin/guest-count", label: "Guest Count", icon: UserCheck },
      { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
      { to: "/admin/cottages", label: "Cottages & Umbrellas", icon: Tent },
      { to: "/admin/facilities", label: "Facilities & Gallery", icon: Sparkles },
      { to: "/admin/rentals", label: "Rentals", icon: LifeBuoy }
    ]
  },
  {
    title: "Finance",
    items: [
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/receipts", label: "Receipts", icon: Receipt },
      { to: "/admin/rates", label: "Rates", icon: Tags }
    ]
  },
  {
    title: "Reports & System",
    items: [
      { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
      { to: "/admin/users", label: "User Management", icon: ShieldCheck },
      { to: "/admin/settings", label: "Admin Settings", icon: Settings }
    ]
  }
];
const AdminSidebar = ({
  mobileOpen,
  onCloseMobile
}) => {
  const { settings } = useReservations();
  const content = <div className="flex flex-col h-full bg-[#133C38] text-[#D7E4E1]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.logoUrl && <SafeImage
    src={settings.logoUrl}
    alt={settings.resortName}
    className="w-7 h-7 rounded object-cover shrink-0"
  />}
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-white uppercase truncate">
              LUCKYSTAR
            </p>
            <p className="text-[11px] text-[#9AB3AE] truncate">Admin Management</p>
          </div>
        </div>
        <button
    type="button"
    onClick={onCloseMobile}
    aria-label="Close navigation"
    className="lg:hidden p-1.5 rounded text-[#C3D5D1] hover:text-white"
  >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => <div key={section.title}>
            <p className="px-3 mb-1.5 text-[11px] font-medium text-[#8BA8A2]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
    const Icon = item.icon;
    return <NavLink
      key={item.to}
      to={item.to}
      onClick={onCloseMobile}
      className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? "bg-white/15 text-white" : "text-[#C8DAD6] hover:bg-white/10 hover:text-white"}`}
    >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>;
  })}
            </div>
          </div>)}
      </nav>
    </div>;
  return <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#0E2E2B] no-print">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-[85vw] h-full z-10">{content}</div>
        </div>}
    </>;
};
export {
  AdminSidebar
};
