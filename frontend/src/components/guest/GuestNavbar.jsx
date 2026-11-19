import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useReservations } from "../../hooks/useReservations";
import { SafeImage } from "../common/SafeImage";
const GuestNavbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { settings } = useReservations();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinkClass = ({ isActive }) => `text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${isActive ? "text-[#143E3B] border-[#143E3B]" : "text-[#435654] border-transparent hover:text-[#143E3B]"}`;
  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };
  return <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE5E3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {
    /* Zone 1: Single-line Brand Wordmark */
  }
        <Link
    to="/"
    className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-[#143E3B]"
  >
          {settings.logoUrl && <SafeImage
    src={settings.logoUrl}
    alt={settings.resortName}
    className="w-8 h-8 rounded object-cover"
  />}
          <span className="text-base sm:text-lg font-bold tracking-tight uppercase">
            {settings.resortName || "LUCKY STAR"}
          </span>
        </Link>

        {
    /* Zone 2: 5 concise single-line nav links */
  }
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/accommodations" className={navLinkClass}>
            Accommodations
          </NavLink>
          <NavLink to="/facilities" className={navLinkClass}>
            Facilities
          </NavLink>
          <NavLink to="/gallery" className={navLinkClass}>
            Gallery
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        {
    /* Zone 3: Primary user action */
  }
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {!isAuthenticated && <>
              <Link
    to="/login"
    className="px-3.5 py-2 text-sm font-medium text-[#152423] hover:text-[#143E3B] whitespace-nowrap shrink-0"
  >
                Login
              </Link>
              <Link
    to="/register"
    className="px-4 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors whitespace-nowrap shrink-0"
  >
                Register
              </Link>
            </>}

          {isAuthenticated && !isAdmin && <>
              <Link
    to="/my-reservations"
    className="text-sm font-medium text-[#435654] hover:text-[#143E3B] whitespace-nowrap shrink-0"
  >
                My Reservations
              </Link>
              <Link
    to="/profile"
    className="text-sm font-medium text-[#152423] hover:text-[#143E3B] whitespace-nowrap shrink-0 truncate max-w-[140px]"
  >
                {user?.name}
              </Link>
              <button
    type="button"
    onClick={handleLogout}
    className="px-3.5 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
  >
                Logout
              </button>
            </>}

          {isAuthenticated && isAdmin && <>
              <Link
    to="/admin/dashboard"
    className="px-4 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors whitespace-nowrap shrink-0"
  >
                Admin Panel
              </Link>
              <button
    type="button"
    onClick={handleLogout}
    className="px-3 py-2 text-sm font-medium text-[#435654] hover:text-[#152423] whitespace-nowrap shrink-0 cursor-pointer"
  >
                Logout
              </button>
            </>}
        </div>

        {
    /* Mobile menu button */
  }
        <button
    type="button"
    onClick={() => setMobileOpen((prev) => !prev)}
    aria-label="Toggle navigation menu"
    className="md:hidden p-2 rounded-lg text-[#152423] hover:bg-[#F5F8F7]"
  >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {
    /* Mobile drawer */
  }
      {mobileOpen && <div className="md:hidden border-t border-[#DCE5E3] bg-white px-4 py-4 space-y-2">
          {[
    { to: "/", label: "Home" },
    { to: "/accommodations", label: "Accommodations" },
    { to: "/facilities", label: "Facilities" },
    { to: "/gallery", label: "Gallery" },
    { to: "/about", label: "About" }
  ].map((item) => <Link
    key={item.to}
    to={item.to}
    onClick={() => setMobileOpen(false)}
    className="block py-2 text-sm font-medium text-[#152423] hover:text-[#143E3B]"
  >
              {item.label}
            </Link>)}
          <div className="pt-3 border-t border-[#E8EEEC] flex flex-col gap-2">
            {!isAuthenticated ? <>
                <Link
    to="/login"
    onClick={() => setMobileOpen(false)}
    className="w-full py-2.5 text-center text-sm font-medium border border-[#DCE5E3] rounded-lg"
  >
                  Login
                </Link>
                <Link
    to="/register"
    onClick={() => setMobileOpen(false)}
    className="w-full py-2.5 text-center text-sm font-medium text-white bg-[#143E3B] rounded-lg"
  >
                  Register
                </Link>
              </> : isAdmin ? <>
                <Link
    to="/admin/dashboard"
    onClick={() => setMobileOpen(false)}
    className="w-full py-2.5 text-center text-sm font-medium text-white bg-[#143E3B] rounded-lg"
  >
                  Admin Panel
                </Link>
                <button
    type="button"
    onClick={handleLogout}
    className="w-full py-2.5 text-center text-sm font-medium border border-[#DCE5E3] rounded-lg"
  >
                  Logout
                </button>
              </> : <>
                <Link
    to="/my-reservations"
    onClick={() => setMobileOpen(false)}
    className="w-full py-2 text-sm font-medium text-[#143E3B]"
  >
                  My Reservations
                </Link>
                <Link
    to="/profile"
    onClick={() => setMobileOpen(false)}
    className="w-full py-2 text-sm font-medium text-[#152423]"
  >
                  My Profile ({user?.name})
                </Link>
                <button
    type="button"
    onClick={handleLogout}
    className="w-full py-2.5 text-center text-sm font-medium text-white bg-[#143E3B] rounded-lg"
  >
                  Logout
                </button>
              </>}
          </div>
        </div>}
    </header>;
};
export {
  GuestNavbar
};
