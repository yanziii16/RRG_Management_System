import { SafeImage } from "../common/SafeImage";
const FacilityCard = ({ facility }) => {
  return <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-[16/10] bg-[#EDF3F1] overflow-hidden">
        <SafeImage
    src={facility.images[0]}
    fallbackTitle={facility.name}
    alt={facility.name}
    className="w-full h-full object-cover"
  />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-xs text-[#5A6D6B]">
          <span>{facility.category}</span>
          <span className="tabular-nums">{facility.operatingHours}</span>
        </div>
        <h3 className="mt-1.5 text-base font-semibold text-[#152423]">{facility.name}</h3>
        <p className="mt-1.5 text-sm text-[#5A6D6B] leading-relaxed flex-1">
          {facility.description}
        </p>
        {facility.rateNote && <p className="mt-3 pt-3 border-t border-[#EEF2F1] text-xs font-medium text-[#143E3B]">
            {facility.rateNote}
          </p>}
      </div>
    </div>;
};
export {
  FacilityCard
};
