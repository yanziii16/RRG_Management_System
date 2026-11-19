import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currencyUtils";
import { SafeImage } from "../common/SafeImage";
const AccommodationCard = ({ item }) => {
  const detailPath = item.category === "Room" ? `/rooms/${item.id}` : `/cottages/${item.id}`;
  const isDayUseOnly = item.bookingMode === "day_use";
  const displayPrice = isDayUseOnly ? item.dayUseRates.Morning : item.ratePerNight;
  const priceSuffix = isDayUseOnly ? "session" : "night";
  return <article className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden flex flex-col">
      <Link to={detailPath} className="block aspect-[4/3] overflow-hidden bg-[#EDF3F1]">
        <SafeImage
    src={item.images[0]}
    fallbackTitle={item.name}
    alt={item.name}
    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
  />
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-[#152423]">{item.name}</h3>
        </div>

        <p className="mt-1.5 text-sm text-[#5A6D6B] line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5A6D6B]">
          <span>{item.capacity} guests</span>
          {item.beds && <>
              <span aria-hidden="true">·</span>
              <span>{item.beds}</span>
            </>}
          <span aria-hidden="true">·</span>
          <span>{item.isAvailable ? "Available" : "Unavailable"}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-[#EEF2F1] flex items-end justify-between gap-3">
          <div>
            <span className="text-lg font-semibold text-[#152423] tabular-nums">
              {formatCurrency(displayPrice)}
            </span>
            <span className="text-xs text-[#5A6D6B] ml-1">/ {priceSuffix}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
    to={detailPath}
    className="px-3 py-2 text-xs font-medium text-[#152423] bg-white border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7] transition-colors whitespace-nowrap"
  >
              View Details
            </Link>
            <Link
    to={`/booking?accommodationId=${item.id}`}
    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${item.isAvailable ? "text-white bg-[#143E3B] hover:bg-[#0E2E2B]" : "text-[#8A9A98] bg-[#EDF3F1] pointer-events-none"}`}
  >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </article>;
};
export {
  AccommodationCard
};
