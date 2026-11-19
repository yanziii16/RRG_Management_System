import { FacilityCard } from "../../components/guest/FacilityCard";
import { EmptyState, Loading } from "../../components/common/Loading";
import { useReservations } from "../../hooks/useReservations";
const Facilities = () => {
  const { facilities, loading } = useReservations();
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#5A6D6B]">Resort Amenities</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          Facilities & Recreation
        </h1>
        <p className="mt-1 text-sm text-[#5A6D6B]">
          Thoughtful spaces around Luckystar Resort designed for swimming, dining, and group gatherings.
        </p>
      </div>

      {loading ? <Loading /> : facilities.length === 0 ? <EmptyState title="No facilities listed yet" /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => <FacilityCard key={fac.id} facility={fac} />)}
        </div>}
    </div>;
};
export {
  Facilities
};
