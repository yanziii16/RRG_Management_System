import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { GuestLayout } from "../layouts/GuestLayout";
import { AdminLogin } from "../pages/admin/AdminLogin";
import { AdminSettings } from "../pages/admin/AdminSettings";
import { CottageManagement } from "../pages/admin/CottageManagement";
import { Dashboard } from "../pages/admin/Dashboard";
import { FacilityManagement } from "../pages/admin/FacilityManagement";
import { GuestCount } from "../pages/admin/GuestCount";
import { GuestManagement } from "../pages/admin/GuestManagement";
import { PaymentManagement } from "../pages/admin/PaymentManagement";
import { RateManagement } from "../pages/admin/RateManagement";
import { ReceiptManagement } from "../pages/admin/ReceiptManagement";
import { RentalManagement } from "../pages/admin/RentalManagement";
import { ReportsAnalytics } from "../pages/admin/ReportsAnalytics";
import { ReservationManagement } from "../pages/admin/ReservationManagement";
import { RoomManagement } from "../pages/admin/RoomManagement";
import { UserManagement } from "../pages/admin/UserManagement";
import { NotFound } from "../pages/errors/NotFound";
import { Unauthorized } from "../pages/errors/Unauthorized";
import { About } from "../pages/guest/About";
import { Accommodations } from "../pages/guest/Accommodations";
import { Booking } from "../pages/guest/Booking";
import { BookingConfirmation } from "../pages/guest/BookingConfirmation";
import { CottageDetails } from "../pages/guest/CottageDetails";
import { Facilities } from "../pages/guest/Facilities";
import { Gallery } from "../pages/guest/Gallery";
import { GuestProfile } from "../pages/guest/GuestProfile";
import { Home } from "../pages/guest/Home";
import { Login } from "../pages/guest/Login";
import { MyReservations } from "../pages/guest/MyReservations";
import { PaymentInformation } from "../pages/guest/PaymentInformation";
import { Register } from "../pages/guest/Register";
import { AccommodationDetailView } from "../pages/guest/RoomDetails";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRedirect } from "./RoleRedirect";
const AppRoutes = () => {
  return <Routes>
      {
    /* Public & Guest Routes under GuestLayout */
  }
      <Route element={<GuestLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/accommodations" element={<Accommodations />} />
        <Route path="/rooms/:id" element={<AccommodationDetailView />} />
        <Route path="/cottages/:id" element={<CottageDetails />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {
    /* Protected Guest Routes */
  }
        <Route element={<ProtectedRoute allowedRoles={["GUEST", "ADMIN"]} redirectTo="/login" />}>
          <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["GUEST"]} redirectTo="/login" />}>
          <Route path="/payment/:id" element={<PaymentInformation />} />
          <Route path="/my-reservations" element={<MyReservations />} />
          <Route path="/profile" element={<GuestProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {
    /* Admin Authentication */
  }
      <Route element={<AuthLayout />}>
        <Route path="/admin" element={<RoleRedirect />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Route>

      {
    /* Protected Admin Interface under AdminLayout (strictly ADMIN only) */
  }
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/guests" element={<GuestManagement />} />
          <Route path="/admin/guest-count" element={<GuestCount />} />
          <Route path="/admin/reservations" element={<ReservationManagement />} />
          <Route path="/admin/rooms" element={<RoomManagement />} />
          <Route path="/admin/cottages" element={<CottageManagement />} />
          <Route path="/admin/facilities" element={<FacilityManagement />} />
          <Route path="/admin/rentals" element={<RentalManagement />} />
          <Route path="/admin/payments" element={<PaymentManagement />} />
          <Route path="/admin/receipts" element={<ReceiptManagement />} />
          <Route path="/admin/rates" element={<RateManagement />} />
          <Route path="/admin/reports" element={<ReportsAnalytics />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>;
};
export {
  AppRoutes
};
