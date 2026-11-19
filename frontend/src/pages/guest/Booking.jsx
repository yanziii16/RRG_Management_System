import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { BookingSummary } from "../../components/guest/BookingSummary";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { useAvailability } from "../../hooks/useAvailability";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { reservationService } from "../../services/reservationService";
import { calculateReservationPricing } from "../../utils/calculations";
import { formatCurrency } from "../../utils/currencyUtils";
import { addDaysISO, getTodayISO } from "../../utils/dateUtils";
import { isValidEmail, isValidPhone } from "../../utils/validation";
const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { accommodations, rentals, settings, loading, refreshAll } = useReservations();
  const { checking, result: availabilityResult, check } = useAvailability();
  const { notify } = useNotification();
  const today = getTodayISO();
  const initialAccId = searchParams.get("accommodationId") || "";
  const initialStayType = searchParams.get("stayType") || "overnight";
  const initialCheckIn = searchParams.get("checkInDate") || today;
  const initialCheckOut = searchParams.get("checkOutDate") || addDaysISO(initialCheckIn, 1);
  const initialSession = searchParams.get("session") || "Morning";
  const initialGuests = Number(searchParams.get("guests")) || 2;
  const [accommodationId, setAccommodationId] = useState(initialAccId);
  const [stayType, setStayType] = useState(initialStayType);
  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [session, setSession] = useState(initialSession);
  const [guestCount, setGuestCount] = useState(initialGuests);
  const [rentalQty, setRentalQty] = useState({});
  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  useEffect(() => {
    if (!accommodationId && accommodations.length > 0) {
      const firstAvail = accommodations.find((a) => a.isAvailable) || accommodations[0];
      setAccommodationId(firstAvail.id);
    }
  }, [accommodations, accommodationId]);
  useEffect(() => {
    if (user) {
      setGuestName((prev) => prev || user.name);
      setGuestEmail((prev) => prev || user.email);
      setGuestPhone((prev) => prev || user.phone);
    }
  }, [user]);
  const selectedAcc = accommodations.find((a) => a.id === accommodationId);
  useEffect(() => {
    if (!selectedAcc) return;
    if (selectedAcc.bookingMode === "day_use" && stayType !== "day_use") {
      setStayType("day_use");
    } else if (selectedAcc.bookingMode === "overnight" && stayType !== "overnight") {
      setStayType("overnight");
    }
    if (guestCount > selectedAcc.capacity) {
      setGuestCount(selectedAcc.capacity);
    }
  }, [selectedAcc, stayType, guestCount]);
  useEffect(() => {
    if (!selectedAcc) return;
    check({
      accommodationId: selectedAcc.id,
      stayType,
      checkInDate,
      checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
      session: stayType === "day_use" ? session : void 0,
      guestCount
    });
  }, [selectedAcc, stayType, checkInDate, checkOutDate, session, guestCount, check]);
  const chosenRentals = useMemo(() => {
    return rentals.filter((r) => (rentalQty[r.id] || 0) > 0).map((r) => {
      const qty = rentalQty[r.id];
      return {
        rentalId: r.id,
        name: r.name,
        quantity: qty,
        unitPrice: r.price,
        subtotal: Math.round(r.price * qty * 100) / 100
      };
    });
  }, [rentals, rentalQty]);
  if (loading) return <Loading />;
  if (!selectedAcc) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-sm text-[#5A6D6B]">
        No accommodations available right now.
      </div>;
  }
  const pricing = calculateReservationPricing({
    accommodation: selectedAcc,
    stayType,
    checkInDate,
    checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
    session,
    rentals: chosenRentals,
    serviceFeeRate: settings.serviceFeeRate
  });
  const updateRental = (id, delta, maxStock) => {
    setRentalQty((prev) => {
      const next = Math.max(0, Math.min(maxStock, (prev[id] || 0) + delta));
      return { ...prev, [id]: next };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent("/booking?" + searchParams.toString())}`);
      return;
    }
    if (isAdmin) {
      setFormError("Admin accounts should create walk-in/manual bookings from the Admin Reservations panel or sign in with a Guest account.");
      return;
    }
    if (!guestName.trim() || !isValidEmail(guestEmail) || !isValidPhone(guestPhone)) {
      setFormError("Please provide valid guest full name, email, and contact number.");
      return;
    }
    if (!agreed) {
      setFormError("Please agree to the resort booking terms and cancellation policy.");
      return;
    }
    setSubmitting(true);
    try {
      const latestCheck = await check({
        accommodationId: selectedAcc.id,
        stayType,
        checkInDate,
        checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
        session: stayType === "day_use" ? session : void 0,
        guestCount
      });
      if (!latestCheck.available) {
        setFormError(latestCheck.reason || "Selected schedule is no longer available.");
        setSubmitting(false);
        return;
      }
      const created = await reservationService.create({
        accommodationId: selectedAcc.id,
        stayType,
        checkInDate,
        checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
        session: stayType === "day_use" ? session : void 0,
        guestCount,
        rentals: chosenRentals.map((r) => ({ rentalId: r.rentalId, quantity: r.quantity })),
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim()
      });
      await refreshAll();
      notify(`Reservation ${created.referenceNumber} submitted!`, "success");
      navigate(`/booking-confirmation/${created.id}`);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not submit reservation."));
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-xs font-medium text-[#5A6D6B]">Reservation</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          Complete your reservation
        </h1>
        <p className="mt-1 text-sm text-[#5A6D6B]">
          Review your stay details, choose optional resort rentals, and submit your booking request.
        </p>
      </div>

      {!isAuthenticated && <div className="mb-6 p-4 rounded-xl bg-white border border-[#DCE5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[#435654]">
            Please sign in or create a guest account to submit your reservation and track status updates.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
    to={`/login?redirect=${encodeURIComponent("/booking?accommodationId=" + selectedAcc.id)}`}
    className="px-4 py-2 text-xs font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B]"
  >
              Log In
            </Link>
            <Link
    to={`/register?redirect=${encodeURIComponent("/booking?accommodationId=" + selectedAcc.id)}`}
    className="px-4 py-2 text-xs font-medium text-[#152423] border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7]"
  >
              Register
            </Link>
          </div>
        </div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {
    /* Stay Details */
  }
          <section className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#152423]">Your stay</h2>

            <div>
              <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                Selected accommodation
              </label>
              <select
    value={accommodationId}
    onChange={(e) => setAccommodationId(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
                {accommodations.map((acc) => <option key={acc.id} value={acc.id}>
                    {acc.name} — {acc.category} (Up to {acc.capacity} guests)
                  </option>)}
              </select>
            </div>

            {selectedAcc.bookingMode === "both" && <div>
                <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                  Booking mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2F6F5] rounded-lg max-w-sm">
                  <button
    type="button"
    onClick={() => setStayType("overnight")}
    className={`py-2 text-xs font-medium rounded-md cursor-pointer ${stayType === "overnight" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#5A6D6B]"}`}
  >
                    Overnight Stay
                  </button>
                  <button
    type="button"
    onClick={() => setStayType("day_use")}
    className={`py-2 text-xs font-medium rounded-md cursor-pointer ${stayType === "day_use" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#5A6D6B]"}`}
  >
                    Day-Use Session
                  </button>
                </div>
              </div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                  {stayType === "day_use" ? "Visit date" : "Check-in date"}
                </label>
                <input
    type="date"
    min={today}
    value={checkInDate}
    onChange={(e) => {
      setCheckInDate(e.target.value);
      if (e.target.value >= checkOutDate) {
        setCheckOutDate(addDaysISO(e.target.value, 1));
      }
    }}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
              </div>

              {stayType === "overnight" ? <div>
                  <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                    Check-out date
                  </label>
                  <input
    type="date"
    min={addDaysISO(checkInDate, 1)}
    value={checkOutDate}
    onChange={(e) => setCheckOutDate(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
                </div> : <div>
                  <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                    Day-use session
                  </label>
                  <select
    value={session}
    onChange={(e) => setSession(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
                    {["Morning", "Afternoon", "Night"].map((s) => {
    const taken = availabilityResult?.unavailableSessions?.includes(s);
    return <option key={s} value={s} disabled={taken}>
                          {s} ({settings.dayUseHours[s]}) {taken ? "— Booked" : ""}
                        </option>;
  })}
                  </select>
                </div>}

              <div>
                <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                  Number of guests (max {selectedAcc.capacity})
                </label>
                <input
    type="number"
    min={1}
    max={selectedAcc.capacity}
    value={guestCount}
    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
              </div>
            </div>

            {availabilityResult && !availabilityResult.available && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {availabilityResult.reason}
              </div>}
          </section>

          {
    /* Optional Rentals */
  }
          <section className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#152423]">Add resort rentals</h2>
              <p className="text-xs text-[#5A6D6B] mt-0.5">
                Optional floaters, extra towels, and equipment for your stay.
              </p>
            </div>

            <div className="divide-y divide-[#EEF2F1]">
              {rentals.filter((r) => r.isAvailable && r.availableQuantity > 0).map((rental) => {
    const qty = rentalQty[rental.id] || 0;
    return <div
      key={rental.id}
      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
                      <div>
                        <p className="text-sm font-medium text-[#152423]">{rental.name}</p>
                        <p className="text-xs text-[#5A6D6B]">
                          {formatCurrency(rental.price)} {rental.unitLabel} ·{" "}
                          {rental.availableQuantity} available
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
      type="button"
      onClick={() => updateRental(rental.id, -1, rental.availableQuantity)}
      disabled={qty === 0}
      aria-label={`Decrease ${rental.name}`}
      className="w-8 h-8 rounded-lg border border-[#DCE5E3] flex items-center justify-center text-[#152423] hover:bg-[#F5F8F7] disabled:opacity-40 cursor-pointer"
    >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {qty}
                        </span>
                        <button
      type="button"
      onClick={() => updateRental(rental.id, 1, rental.availableQuantity)}
      disabled={qty >= rental.availableQuantity}
      aria-label={`Increase ${rental.name}`}
      className="w-8 h-8 rounded-lg border border-[#DCE5E3] flex items-center justify-center text-[#152423] hover:bg-[#F5F8F7] disabled:opacity-40 cursor-pointer"
    >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>;
  })}
            </div>
          </section>

          {
    /* Guest Information */
  }
          <section className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#152423]">Guest information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
    label="Full name"
    required
    value={guestName}
    onChange={(e) => setGuestName(e.target.value)}
    placeholder="Guest full name"
  />
              </div>
              <Input
    label="Email address"
    type="email"
    required
    value={guestEmail}
    onChange={(e) => setGuestEmail(e.target.value)}
    placeholder="you@example.com"
  />
              <Input
    label="Contact number"
    type="tel"
    required
    value={guestPhone}
    onChange={(e) => setGuestPhone(e.target.value)}
    placeholder="+63 912 345 6789"
  />
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                  Special requests (optional)
                </label>
                <textarea
    rows={3}
    value={specialRequests}
    onChange={(e) => setSpecialRequests(e.target.value)}
    placeholder="Any arrival notes, seating preferences, or special requests..."
    className="w-full px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg text-[#152423] placeholder:text-[#8A9A98] focus:outline-none focus:ring-2 focus:ring-[#143E3B]/20 focus:border-[#143E3B]"
  />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#5A6D6B] cursor-pointer">
              <input
    type="checkbox"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    className="mt-0.5 rounded border-[#DCE5E3]"
  />
              <span>
                I confirm my reservation details and agree to Luckystar Resort's check-in, check-out, and cancellation policies.
              </span>
            </label>

            {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {formError}
              </div>}

            <Button
    type="submit"
    size="lg"
    className="w-full"
    loading={submitting}
    disabled={checking || (availabilityResult ? !availabilityResult.available : false)}
  >
              Submit Reservation ({formatCurrency(pricing.totalAmount, true)})
            </Button>
          </section>
        </div>

        {
    /* Right Sticky Summary */
  }
        <div className="lg:sticky lg:top-24">
          <BookingSummary
    accommodation={selectedAcc}
    stayType={stayType}
    checkInDate={checkInDate}
    checkOutDate={stayType === "day_use" ? checkInDate : checkOutDate}
    session={session}
    nights={pricing.nights}
    guestCount={guestCount}
    rentals={chosenRentals}
    baseAmount={pricing.baseAmount}
    rentalsAmount={pricing.rentalsAmount}
    serviceFee={pricing.serviceFee}
    totalAmount={pricing.totalAmount}
    checkInTime={settings.checkInTime}
    checkOutTime={settings.checkOutTime}
    dayUseHours={settings.dayUseHours}
  />
        </div>
      </form>
    </div>;
};
export {
  Booking
};
