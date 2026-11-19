import { Link } from "react-router-dom";
import { SafeImage } from "../../components/common/SafeImage";
import { RESORT_MEDIA } from "../../data/mockData";
import { useReservations } from "../../hooks/useReservations";
const About = () => {
  const { settings } = useReservations();
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col justify-center space-y-4">
          <p className="text-xs font-medium text-[#5A6D6B]">About {settings.resortName}</p>
          <h1
    className="text-2xl sm:text-4xl font-semibold text-[#152423] tracking-tight"
    style={{ textWrap: "balance" }}
  >
            {settings.tagline}
          </h1>
          <p className="text-sm sm:text-base text-[#435654] leading-relaxed">
            {settings.description}
          </p>
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-[#152423]">Our Mission</h2>
            <p className="mt-1 text-sm text-[#5A6D6B] leading-relaxed">{settings.mission}</p>
          </div>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
    to="/accommodations"
    className="px-5 py-2.5 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors"
  >
              Explore Accommodations
            </Link>
            <Link
    to="/booking"
    className="px-5 py-2.5 text-sm font-medium text-[#152423] bg-white border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7] transition-colors"
  >
              Make a Reservation
            </Link>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-[#DCE5E3] bg-white">
          <SafeImage
    src={settings.heroImageUrl || RESORT_MEDIA.heroPool}
    alt="Luckystar Resort grounds"
    className="w-full h-full min-h-[280px] object-cover"
  />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#152423]">Overnight Hours</h3>
          <p className="mt-2 text-sm text-[#5A6D6B]">
            Check-in begins at <strong className="text-[#152423]">{settings.checkInTime}</strong> and check-out is at{" "}
            <strong className="text-[#152423]">{settings.checkOutTime}</strong> the following day.
          </p>
        </div>

        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#152423]">Day-Use Cottage Sessions</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#5A6D6B] tabular-nums">
            <li>Morning: {settings.dayUseHours.Morning}</li>
            <li>Afternoon: {settings.dayUseHours.Afternoon}</li>
            <li>Night: {settings.dayUseHours.Night}</li>
          </ul>
        </div>

        <div className="bg-white border border-[#DCE5E3] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#152423]">Resort Contact</h3>
          <div className="mt-2 space-y-1 text-sm text-[#5A6D6B]">
            <p className="tabular-nums">{settings.phone}</p>
            <p>{settings.email}</p>
            <p className="text-xs pt-1">{settings.address}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-[#DCE5E3] aspect-[16/9]">
          <SafeImage
    src={RESORT_MEDIA.goldenHour}
    alt="Luckystar Resort at sunset"
    className="w-full h-full object-cover"
  />
        </div>
        <div className="rounded-xl overflow-hidden border border-[#DCE5E3] aspect-[16/9]">
          <SafeImage
    src={RESORT_MEDIA.regularCottage}
    alt="Poolside cottages"
    className="w-full h-full object-cover"
  />
        </div>
      </div>
    </div>;
};
export {
  About
};
