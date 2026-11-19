import { Outlet } from "react-router-dom";
import { GuestFooter } from "../components/guest/GuestFooter";
import { GuestNavbar } from "../components/guest/GuestNavbar";
const GuestLayout = () => {
  return <div className="min-h-screen flex flex-col bg-[#F5F8F7] text-[#152423]">
      <GuestNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <GuestFooter />
    </div>;
};
export {
  GuestLayout
};
