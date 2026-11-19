import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateDisplay } from "../../utils/dateUtils";
import { SafeImage } from "../common/SafeImage";
const BookingSummary = ({
  accommodation,
  stayType,
  checkInDate,
  checkOutDate,
  session = "Morning",
  nights,
  guestCount,
  rentals,
  baseAmount,
  rentalsAmount,
  serviceFee,
  totalAmount,
  checkInTime,
  checkOutTime,
  dayUseHours
}) => {
  return <div className="bg-white border border-[#DCE5E3] rounded-xl p-5 space-y-4">
      <h3 className="text-base font-semibold text-[#152423]">Booking summary</h3>

      <div className="rounded-lg overflow-hidden border border-[#E8EEEC]">
        <SafeImage
    src={accommodation.images[0]}
    fallbackTitle={accommodation.name}
    alt={accommodation.name}
    className="w-full h-36 object-cover"
  />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#152423]">{accommodation.name}</h4>
        <p className="text-xs text-[#5A6D6B] mt-0.5">
          {accommodation.category} · Max {accommodation.capacity} guests · {guestCount} selected
        </p>
      </div>

      <div className="border-t border-[#EEF2F1] pt-3 space-y-2 text-xs">
        {stayType === "overnight" ? <>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Check-in</span>
              <span className="font-medium text-[#152423] tabular-nums">
                {formatDateDisplay(checkInDate)} ({checkInTime})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Check-out</span>
              <span className="font-medium text-[#152423] tabular-nums">
                {formatDateDisplay(checkOutDate)} ({checkOutTime})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Length of stay</span>
              <span className="font-medium text-[#152423] tabular-nums">
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </div>
          </> : <>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Day-use date</span>
              <span className="font-medium text-[#152423] tabular-nums">
                {formatDateDisplay(checkInDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Session</span>
              <span className="font-medium text-[#152423]">
                {session} {dayUseHours?.[session] ? `(${dayUseHours[session]})` : ""}
              </span>
            </div>
          </>}
      </div>

      <div className="border-t border-[#EEF2F1] pt-3 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-[#5A6D6B]">
            {stayType === "overnight" ? `${formatPesoExact(accommodation.ratePerNight)} × ${nights} night(s)` : `Day-use (${session} session)`}
          </span>
          <span className="font-medium text-[#152423] tabular-nums">
            {formatPesoExact(baseAmount)}
          </span>
        </div>

        {rentals.map((r) => <div key={r.rentalId} className="flex justify-between">
            <span className="text-[#5A6D6B]">
              {r.name} × {r.quantity}
            </span>
            <span className="font-medium text-[#152423] tabular-nums">
              {formatPesoExact(r.subtotal)}
            </span>
          </div>)}

        {rentalsAmount > 0 && <div className="flex justify-between text-[#5A6D6B]">
            <span>Rentals subtotal</span>
            <span className="tabular-nums">{formatPesoExact(rentalsAmount)}</span>
          </div>}

        <div className="flex justify-between">
          <span className="text-[#5A6D6B]">Service & resort fee (5%)</span>
          <span className="font-medium text-[#152423] tabular-nums">
            {formatPesoExact(serviceFee)}
          </span>
        </div>
      </div>

      <div className="border-t border-[#DCE5E3] pt-3 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-[#152423]">Total (PHP)</span>
        <span className="text-xl font-bold text-[#143E3B] tabular-nums">
          {formatPesoExact(totalAmount)}
        </span>
      </div>
    </div>;
};
export {
  BookingSummary
};
