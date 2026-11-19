import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminHeader } from "../components/admin/AdminHeader";
import { AdminSidebar } from "../components/admin/AdminSidebar";
const ROUTE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/reservations": "Reservation Management",
  "/admin/guests": "Guest Management",
  "/admin/guest-count": "Walk-In Guest Count",
  "/admin/rooms": "Room Management",
  "/admin/cottages": "Cottage & Umbrella Management",
  "/admin/facilities": "Facility & Gallery Management",
  "/admin/rentals": "Rental Management",
  "/admin/payments": "Payment Management",
  "/admin/receipts": "Receipt Management",
  "/admin/rates": "Rate Management",
  "/admin/reports": "Reports & Analytics",
  "/admin/users": "User Management",
  "/admin/settings": "Admin Settings"
};
const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] || "Admin Portal";
  return <div className="min-h-screen flex bg-[#F4F7F6] text-[#152423]">
      <AdminSidebar
    mobileOpen={mobileOpen}
    onCloseMobile={() => setMobileOpen(false)}
  />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onOpenMobile={() => setMobileOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>;
};
export {
  AdminLayout
};
