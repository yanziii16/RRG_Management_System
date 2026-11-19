import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { accommodationService } from "../../services/accommodationService";
import { extractErrorMessage } from "../../services/api";
import { rentalService } from "../../services/rentalService";
const RateManagement = () => {
  const { accommodations, rentals, loading, refreshPublicData } = useReservations();
  const { notify } = useNotification();
  const [accDrafts, setAccDrafts] = useState({});
  const [rentalDrafts, setRentalDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  useEffect(() => {
    const aMap = {};
    accommodations.forEach((a) => {
      aMap[a.id] = {
        ratePerNight: a.ratePerNight,
        Morning: a.dayUseRates.Morning,
        Afternoon: a.dayUseRates.Afternoon,
        Night: a.dayUseRates.Night
      };
    });
    setAccDrafts(aMap);
    const rMap = {};
    rentals.forEach((r) => {
      rMap[r.id] = r.price;
    });
    setRentalDrafts(rMap);
  }, [accommodations, rentals]);
  const saveAccommodationRate = async (acc) => {
    const draft = accDrafts[acc.id];
    if (!draft) return;
    setSavingId(acc.id);
    try {
      await accommodationService.update(acc.id, {
        ratePerNight: Number(draft.ratePerNight) || 0,
        dayUseRates: {
          Morning: Number(draft.Morning) || 0,
          Afternoon: Number(draft.Afternoon) || 0,
          Night: Number(draft.Night) || 0
        }
      });
      await refreshPublicData();
      notify(`Rates updated for ${acc.name}.`, "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to update rates."), "error");
    } finally {
      setSavingId(null);
    }
  };
  const saveRentalRate = async (rental) => {
    const price = rentalDrafts[rental.id];
    setSavingId(rental.id);
    try {
      await rentalService.update(rental.id, { price: Number(price) || 0 });
      await refreshPublicData();
      notify(`Rate updated for ${rental.name}.`, "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to update rental rate."), "error");
    } finally {
      setSavingId(null);
    }
  };
  if (loading) return <Loading />;
  return <div className="space-y-8">
      <AdminPageHeader
    title="Rate Management"
    subtitle="Update nightly room rates, cottage day-use session pricing, and resort rental fees."
  />

      {
    /* Room & Cottage Rates */
  }
      <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EEEC]">
          <h2 className="text-sm font-semibold text-[#152423]">
            Accommodation Rates (Rooms, Cottages & Umbrellas)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7FAF9] border-b border-[#E8EEEC] text-[#435654]">
                <th className="px-4 py-3 font-semibold">Accommodation</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Overnight (₱)</th>
                <th className="px-4 py-3 font-semibold">Morning (₱)</th>
                <th className="px-4 py-3 font-semibold">Afternoon (₱)</th>
                <th className="px-4 py-3 font-semibold">Night (₱)</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F1]">
              {accommodations.map((acc) => {
    const draft = accDrafts[acc.id] || {
      ratePerNight: acc.ratePerNight,
      Morning: acc.dayUseRates.Morning,
      Afternoon: acc.dayUseRates.Afternoon,
      Night: acc.dayUseRates.Night
    };
    return <tr key={acc.id}>
                    <td className="px-4 py-3 font-medium text-[#152423]">{acc.name}</td>
                    <td className="px-4 py-3 text-[#5A6D6B]">{acc.category}</td>
                    <td className="px-4 py-3">
                      <input
      type="number"
      min={0}
      disabled={acc.bookingMode === "day_use"}
      value={draft.ratePerNight}
      onChange={(e) => setAccDrafts((prev) => ({
        ...prev,
        [acc.id]: { ...draft, ratePerNight: Number(e.target.value) }
      }))}
      className="w-24 px-2.5 py-1.5 border border-[#DCE5E3] rounded-md tabular-nums disabled:bg-[#F5F8F7] disabled:text-[#8A9A98]"
    />
                    </td>
                    <td className="px-4 py-3">
                      <input
      type="number"
      min={0}
      disabled={acc.bookingMode === "overnight"}
      value={draft.Morning}
      onChange={(e) => setAccDrafts((prev) => ({
        ...prev,
        [acc.id]: { ...draft, Morning: Number(e.target.value) }
      }))}
      className="w-24 px-2.5 py-1.5 border border-[#DCE5E3] rounded-md tabular-nums disabled:bg-[#F5F8F7] disabled:text-[#8A9A98]"
    />
                    </td>
                    <td className="px-4 py-3">
                      <input
      type="number"
      min={0}
      disabled={acc.bookingMode === "overnight"}
      value={draft.Afternoon}
      onChange={(e) => setAccDrafts((prev) => ({
        ...prev,
        [acc.id]: { ...draft, Afternoon: Number(e.target.value) }
      }))}
      className="w-24 px-2.5 py-1.5 border border-[#DCE5E3] rounded-md tabular-nums disabled:bg-[#F5F8F7] disabled:text-[#8A9A98]"
    />
                    </td>
                    <td className="px-4 py-3">
                      <input
      type="number"
      min={0}
      disabled={acc.bookingMode === "overnight"}
      value={draft.Night}
      onChange={(e) => setAccDrafts((prev) => ({
        ...prev,
        [acc.id]: { ...draft, Night: Number(e.target.value) }
      }))}
      className="w-24 px-2.5 py-1.5 border border-[#DCE5E3] rounded-md tabular-nums disabled:bg-[#F5F8F7] disabled:text-[#8A9A98]"
    />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
      type="button"
      size="sm"
      loading={savingId === acc.id}
      onClick={() => saveAccommodationRate(acc)}
    >
                        Update
                      </Button>
                    </td>
                  </tr>;
  })}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Rental Rates */
  }
      <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EEEC]">
          <h2 className="text-sm font-semibold text-[#152423]">Rental Item Rates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7FAF9] border-b border-[#E8EEEC] text-[#435654]">
                <th className="px-4 py-3 font-semibold">Rental Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Price (₱)</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F1]">
              {rentals.map((ren) => <tr key={ren.id}>
                  <td className="px-4 py-3 font-medium text-[#152423]">{ren.name}</td>
                  <td className="px-4 py-3 text-[#5A6D6B]">{ren.category}</td>
                  <td className="px-4 py-3 text-[#5A6D6B]">{ren.unitLabel}</td>
                  <td className="px-4 py-3">
                    <input
    type="number"
    min={0}
    value={rentalDrafts[ren.id] ?? ren.price}
    onChange={(e) => setRentalDrafts((prev) => ({
      ...prev,
      [ren.id]: Number(e.target.value)
    }))}
    className="w-28 px-2.5 py-1.5 border border-[#DCE5E3] rounded-md tabular-nums"
  />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
    type="button"
    size="sm"
    loading={savingId === ren.id}
    onClick={() => saveRentalRate(ren)}
  >
                      Update
                    </Button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
export {
  RateManagement
};
