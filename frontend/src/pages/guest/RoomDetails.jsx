import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Loading, EmptyState } from "../../components/common/Loading";
import { SafeImage } from "../../components/common/SafeImage";
import { useAvailability } from "../../hooks/useAvailability";
import { useReservations } from "../../hooks/useReservations";
import { formatCurrency } from "../../utils/currencyUtils";
import { addDaysISO, calculateNights, getTodayISO } from "../../utils/dateUtils";
const AccommodationDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accommodations, settings, loading } = useReservations();
  const { checking, result, check } = useAvailability();
  const item = accommodations.find((a) => a.id === id);
  const today = getTodayISO();
  const [activeImage, setActiveImage] = useState(0);
  const [stayType, setStayType] = useState("overnight");
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(addDaysISO(today, 1));
  const [session, setSession] = useState("Morning");
  const [guestCount, setGuestCount] = useState(2);
  useEffect(() => {
    if (!item) return;
    setStayType(item.bookingMode === "day_use" ? "day_use" : "overnight");
    setGuestCount(Math.min(2, item.capacity));
  }, [item]);
  useEffect(() => {
    if (!item) return;
    check({
      accommodationId: item.id,
      stayType,
      checkInDate,
      checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
      session: stayType === "day_use" ? session : void 0,
      guestCount
    });
  }, [item, stayType, checkInDate, checkOutDate, session, guestCount, check]);
  if (loading) return <Loading />;
  if (!item) {
    return <div className="max-w-4xl mx-auto px-4 py-14">
        <EmptyState
      title="Accommodation not found"
      description="The requested room or cottage could not be found."
      action={<Link to="/accommodations" className="text-sm font-medium text-[#143E3B] underline">
              Back to accommodations
            </Link>}
    />
      </div>;
  }
  const nights = stayType === "overnight" ? Math.max(1, calculateNights(checkInDate, checkOutDate)) : 0;
  const estimatedSubtotal = stayType === "overnight" ? item.ratePerNight * nights : item.dayUseRates[session] ?? item.ratePerNight;
  const handleBookNow = () => {
    const params = new URLSearchParams({
      accommodationId: item.id,
      stayType,
      checkInDate,
      checkOutDate: stayType === "day_use" ? checkInDate : checkOutDate,
      guests: String(guestCount)
    });
    if (stayType === "day_use") params.set("session", session);
    navigate(`/booking?${params.toString()}`);
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
    to="/accommodations"
    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6D6B] hover:text-[#143E3B] mb-4"
  >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to accommodations</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          {item.name}
        </h1>
        <p className="mt-1 text-sm text-[#5A6D6B]">
          {item.category} · Up to {item.capacity} guests
          {item.beds ? ` · ${item.beds}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {
    /* Left: Photos + Info */
  }
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
            <div className="aspect-[16/10] bg-[#EDF3F1]">
              <SafeImage
    src={item.images[activeImage] || item.images[0]}
    fallbackTitle={item.name}
    alt={item.name}
    className="w-full h-full object-cover"
  />
            </div>
            {item.images.length > 1 && <div className="p-3 flex gap-2.5 overflow-x-auto border-t border-[#EEF2F1]">
                {item.images.map((img, idx) => <button
    key={`${img}-${idx}`}
    type="button"
    onClick={() => setActiveImage(idx)}
    className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${activeImage === idx ? "border-[#143E3B]" : "border-transparent opacity-75"}`}
  >
                    <SafeImage src={img} alt={`${item.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>)}
              </div>}
          </div>

          <div className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-[#152423]">About this accommodation</h2>
              <p className="mt-2 text-sm text-[#435654] leading-relaxed">{item.description}</p>
            </div>

            <div className="border-t border-[#EEF2F1] pt-5">
              <h3 className="text-sm font-semibold text-[#152423]">What's included</h3>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm text-[#435654]">
                    <Check className="w-4 h-4 text-[#143E3B] shrink-0" />
                    <span>{amenity}</span>
                  </li>)}
              </ul>
            </div>

            {item.bookingMode !== "overnight" && <div className="border-t border-[#EEF2F1] pt-5">
                <h3 className="text-sm font-semibold text-[#152423]">Day-use session rates</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {["Morning", "Afternoon", "Night"].map((s) => <div key={s} className="p-3 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC]">
                      <p className="font-medium text-[#152423]">{s}</p>
                      <p className="text-xs text-[#5A6D6B]">{settings.dayUseHours[s]}</p>
                      <p className="mt-1 font-semibold text-[#143E3B] tabular-nums">
                        {formatCurrency(item.dayUseRates[s])}
                      </p>
                    </div>)}
                </div>
              </div>}

            <div className="border-t border-[#EEF2F1] pt-5">
              <h3 className="text-sm font-semibold text-[#152423]">Before you book</h3>
              <p className="mt-2 text-xs text-[#5A6D6B] leading-relaxed">
                Overnight check-in is {settings.checkInTime} and check-out is {settings.checkOutTime}.{" "}
                {settings.cancellationPolicy}
              </p>
            </div>
          </div>
        </div>

        {
    /* Right: Sticky Booking Card */
  }
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-[#152423] tabular-nums">
                {formatCurrency(
    stayType === "overnight" ? item.ratePerNight : item.dayUseRates[session]
  )}
              </span>
              <span className="text-xs text-[#5A6D6B] ml-1">
                / {stayType === "overnight" ? "night" : "session"}
              </span>
            </div>
          </div>

          {item.bookingMode === "both" && <div className="grid grid-cols-2 gap-1 p-1 bg-[#F2F6F5] rounded-lg">
              <button
    type="button"
    onClick={() => setStayType("overnight")}
    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${stayType === "overnight" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#5A6D6B]"}`}
  >
                Overnight
              </button>
              <button
    type="button"
    onClick={() => setStayType("day_use")}
    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${stayType === "day_use" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#5A6D6B]"}`}
  >
                Day Use
              </button>
            </div>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#2A3B39] mb-1">
                {stayType === "day_use" ? "Visit date" : "Check-in"}
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
                <label className="block text-xs font-medium text-[#2A3B39] mb-1">
                  Check-out
                </label>
                <input
    type="date"
    min={addDaysISO(checkInDate, 1)}
    value={checkOutDate}
    onChange={(e) => setCheckOutDate(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
              </div> : <div>
                <label className="block text-xs font-medium text-[#2A3B39] mb-1">
                  Session
                </label>
                <select
    value={session}
    onChange={(e) => setSession(e.target.value)}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
  >
                  {["Morning", "Afternoon", "Night"].map((s) => {
    const taken = result?.unavailableSessions?.includes(s);
    return <option key={s} value={s} disabled={taken}>
                        {s} ({settings.dayUseHours[s]}) {taken ? "— Booked" : ""}
                      </option>;
  })}
                </select>
              </div>}

            <div>
              <label className="block text-xs font-medium text-[#2A3B39] mb-1">
                Number of guests (max {item.capacity})
              </label>
              <input
    type="number"
    min={1}
    max={item.capacity}
    value={guestCount}
    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
    className="w-full min-h-[40px] px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
            </div>
          </div>

          <div className="p-3 rounded-lg text-xs border border-[#E8EEEC] bg-[#F8FBFA]">
            {checking ? <span className="text-[#5A6D6B]">Checking availability...</span> : result?.available ? <span className="text-emerald-800 font-medium">
                Available for your selected {stayType === "overnight" ? "dates" : "session"}.
              </span> : <span className="text-red-700 font-medium">
                {result?.reason || "Not available for the selected schedule."}
              </span>}
          </div>

          <div className="border-t border-[#EEF2F1] pt-3 flex items-center justify-between text-sm">
            <span className="text-[#5A6D6B]">
              {stayType === "overnight" ? `${nights} ${nights === 1 ? "night" : "nights"} base rate` : `${session} session base rate`}
            </span>
            <span className="font-semibold text-[#152423] tabular-nums">
              {formatCurrency(estimatedSubtotal)}
            </span>
          </div>

          <Button
    type="button"
    onClick={handleBookNow}
    disabled={!result?.available || checking}
    className="w-full"
    size="lg"
  >
            Book Now
          </Button>
        </div>
      </div>
    </div>;
};
export {
  AccommodationDetailView
};
