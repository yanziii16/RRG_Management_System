import { useContext } from "react";
import { ReservationContext } from "../context/ReservationContext";
function useReservations() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used inside ReservationProvider");
  return ctx;
}
export {
  useReservations
};
