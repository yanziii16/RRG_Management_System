import { Link } from "react-router-dom";
import { useReservations } from "../../hooks/useReservations";
const GuestFooter = () => {
  const { settings } = useReservations();
  return <footer className="bg-[#113633] text-[#D7E4E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-base font-semibold text-white">{settings.resortName}</h3>
            <p className="mt-2.5 text-sm text-[#B8CCC8] leading-relaxed max-w-sm">
              {settings.tagline} A clean, comfortable stay designed for families, groups, and restful weekend escapes.
            </p>
            <p className="mt-3 text-xs text-[#9AB3AE]">{settings.address}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Explore the resort</h4>
            <ul className="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-sm text-[#C3D5D1]">
              <li>
                <Link to="/accommodations" className="hover:text-white transition-colors">
                  Accommodations
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-white transition-colors">
                  Facilities
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors">
                  Book a Stay
                </Link>
              </li>
              <li>
                <Link to="/my-reservations" className="hover:text-white transition-colors">
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">We are here to help</h4>
            <div className="mt-3 space-y-1.5 text-sm text-[#C3D5D1]">
              <p className="tabular-nums">{settings.phone}</p>
              <p>{settings.email}</p>
              <p className="text-xs text-[#9AB3AE] pt-1">
                Overnight Check-in: {settings.checkInTime} · Check-out: {settings.checkOutTime}
              </p>
              <p className="pt-2">
                <Link
    to="/admin/login"
    className="text-xs text-[#B8CCC8] underline hover:text-white"
  >
                  Resort Admin Portal
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AB3AE]">
          <p>© {(/* @__PURE__ */ new Date()).getFullYear()} {settings.resortName}. All rights reserved.</p>
          <p>Check-in {settings.checkInTime} · Check-out {settings.checkOutTime}</p>
        </div>
      </div>
    </footer>;
};
export {
  GuestFooter
};
