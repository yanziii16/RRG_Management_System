import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { INITIAL_SETTINGS } from "../data/mockData";
import { accommodationService } from "../services/accommodationService";
import { paymentService } from "../services/paymentService";
import { rentalService } from "../services/rentalService";
import { reservationService } from "../services/reservationService";
import { settingsService } from "../services/settingsService";
import { AuthContext } from "./AuthContext";
const ReservationContext = createContext(null);
const ReservationProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const [accommodations, setAccommodations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const refreshPublicData = useCallback(async () => {
    try {
      const [acc, fac, gal, ren, set] = await Promise.all([
        accommodationService.getAll(),
        accommodationService.getFacilities(),
        accommodationService.getGallery(),
        rentalService.getAll(),
        settingsService.get()
      ]);
      setAccommodations(acc);
      setFacilities(fac);
      setGallery(gal);
      setRentals(ren);
      setSettings(set);
    } catch {
    }
  }, []);
  const refreshPrivateData = useCallback(async () => {
    if (!auth?.isAuthenticated) {
      setReservations([]);
      setPayments([]);
      return;
    }
    try {
      const [resList, payList] = await Promise.all([
        reservationService.getAll(),
        paymentService.getAll()
      ]);
      setReservations(resList);
      setPayments(payList);
    } catch {
    }
  }, [auth?.isAuthenticated]);
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshPublicData(), refreshPrivateData()]);
    setLoading(false);
  }, [refreshPublicData, refreshPrivateData]);
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);
  return <ReservationContext.Provider
    value={{
      accommodations,
      facilities,
      gallery,
      rentals,
      reservations,
      payments,
      settings,
      loading,
      refreshPublicData,
      refreshPrivateData,
      refreshAll
    }}
  >
      {children}
    </ReservationContext.Provider>;
};
export {
  ReservationContext,
  ReservationProvider
};
