import { useMemo, useState } from "react";
import { AccommodationCard } from "../../components/guest/AccommodationCard";
import { Button } from "../../components/common/Button";
import { EmptyState, Loading } from "../../components/common/Loading";
import { useReservations } from "../../hooks/useReservations";
import { checkAccommodationAvailability } from "../../utils/calculations";
import { addDaysISO, getTodayISO } from "../../utils/dateUtils";
const Accommodations = () => {
  const { accommodations, reservations, settings, loading } = useReservations();
  const today = getTodayISO();
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(addDaysISO(today, 1));
  const [guestCount, setGuestCount] = useState(2);
  const [category, setCategory] = useState("All");
  const [stayMode, setStayMode] = useState("all");
  const [session, setSession] = useState("Morning");
  const [appliedFilter, setAppliedFilter] = useState(false);
  const filtered = useMemo(() => {
    return accommodations.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (guestCount > item.capacity) return false;
      if (stayMode === "overnight" && item.bookingMode === "day_use") return false;
      if (stayMode === "day_use" && item.bookingMode === "overnight") return false;
      if (appliedFilter) {
        const effectiveType = stayMode === "day_use" || item.bookingMode === "day_use" ? "day_use" : "overnight";
        const availability = checkAccommodationAvailability({
          accommodation: item,
          reservations,
          stayType: effectiveType,
          checkInDate,
          checkOutDate: effectiveType === "day_use" ? checkInDate : checkOutDate,
          session: effectiveType === "day_use" ? session : void 0,
          guestCount
        });
        return availability.available;
      }
      return true;
    });
  }, [
    accommodations,
    category,
    guestCount,
    stayMode,
    appliedFilter,
    reservations,
    checkInDate,
    checkOutDate,
    session
  ]);
  const handleCheck = (e) => {
    e.preventDefault();
    setAppliedFilter(true);
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <p className="text-xs font-medium text-[#5A6D6B]">Accommodations</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          Find your perfect stay
        </h1>
        <p className="mt-1 text-sm text-[#5A6D6B]">
          Explore our rooms, cottages, and poolside umbrellas. Filter by dates, guests, or stay type.
        </p>
      </div>

      {
    /* Availability Filter Bar */
  }
      <form
    onSubmit={handleCheck}
    className="bg-white border border-[#DCE5E3] rounded-xl p-4 sm:p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
  >
        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">
            Stay type
          </label>
          <select
    value={stayMode}
    onChange={(e) => setStayMode(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
            <option value="all">All stays</option>
            <option value="overnight">Overnight</option>
            <option value="day_use">Day-use session</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">
            {stayMode === "day_use" ? "Visit date" : "Check-in date"}
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
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg tabular-nums"
  />
        </div>

        {stayMode === "day_use" ? <div>
            <label className="block text-xs font-medium text-[#2A3B39] mb-1">
              Session
            </label>
            <select
    value={session}
    onChange={(e) => setSession(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
              <option value="Morning">Morning (8AM - 12PM)</option>
              <option value="Afternoon">Afternoon (1PM - 5PM)</option>
              <option value="Night">Night (6PM - 10PM)</option>
            </select>
          </div> : <div>
            <label className="block text-xs font-medium text-[#2A3B39] mb-1">
              Check-out date
            </label>
            <input
    type="date"
    min={addDaysISO(checkInDate, 1)}
    value={checkOutDate}
    onChange={(e) => setCheckOutDate(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg tabular-nums"
  />
          </div>}

        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">
            Number of guests
          </label>
          <input
    type="number"
    min={1}
    max={30}
    value={guestCount}
    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg tabular-nums"
  />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">
            Category
          </label>
          <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
            <option value="All">All categories</option>
            <option value="Room">Rooms</option>
            <option value="Cottage">Cottages</option>
            <option value="Umbrella">Umbrellas</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="w-full">
            Check Availability
          </Button>
          {appliedFilter && <Button
    type="button"
    variant="outline"
    onClick={() => {
      setAppliedFilter(false);
      setCategory("All");
      setStayMode("all");
      setGuestCount(2);
    }}
  >
              Reset
            </Button>}
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between text-xs text-[#5A6D6B]">
        <span className="tabular-nums font-medium text-[#152423]">
          {filtered.length} accommodation{filtered.length === 1 ? "" : "s"} available
        </span>
        {appliedFilter && <span className="tabular-nums">
            Filtered for {checkInDate}
            {stayMode === "day_use" ? ` (${session})` : ` to ${checkOutDate}`} · {guestCount} guest(s)
          </span>}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState
    title="No accommodations match your filters"
    description="Try adjusting your check-in dates, reducing guest count, or clearing your category filter."
    action={<Button
      variant="outline"
      onClick={() => {
        setAppliedFilter(false);
        setCategory("All");
        setStayMode("all");
        setGuestCount(1);
      }}
    >
              Show all accommodations
            </Button>}
  /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => <AccommodationCard key={item.id} item={item} />)}
        </div>}

      {
    /* Helpful Arrival & Support Info */
  }
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#152423]">Plan your arrival</h3>
          <p className="mt-1.5 text-sm text-[#5A6D6B] leading-relaxed">
            Overnight check-in starts at {settings.checkInTime} and check-out is at{" "}
            {settings.checkOutTime}. Day-use cottages operate in Morning, Afternoon, and Night sessions.
          </p>
        </div>
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#152423]">Need help choosing?</h3>
          <p className="mt-1.5 text-sm text-[#5A6D6B] leading-relaxed">
            Reach our resort front desk at {settings.phone} or {settings.email} for group bookings and special requests.
          </p>
        </div>
      </div>
    </div>;
};
export {
  Accommodations
};
