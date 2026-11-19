import { calculateNights, datesOverlap } from "./dateUtils.js";
const ACTIVE_RESERVATION_STATUSES = /* @__PURE__ */ new Set(["Pending", "Confirmed", "Checked-In"]);
function calculateReservationPricing(params) {
  const {
    accommodation,
    stayType,
    checkInDate,
    checkOutDate,
    session = "Morning",
    rentals,
    serviceFeeRate = 0.05
  } = params;
  const nights = stayType === "overnight" ? Math.max(1, calculateNights(checkInDate, checkOutDate)) : 0;
  const baseAmount = stayType === "overnight" ? accommodation.ratePerNight * nights : accommodation.dayUseRates[session] ?? accommodation.ratePerNight;
  const rentalsAmount = rentals.reduce((sum, item) => sum + item.subtotal, 0);
  const serviceFee = Math.round((baseAmount + rentalsAmount) * serviceFeeRate * 100) / 100;
  const totalAmount = Math.round((baseAmount + rentalsAmount + serviceFee) * 100) / 100;
  return {
    nights,
    baseAmount,
    rentalsAmount,
    serviceFee,
    totalAmount
  };
}
function checkAccommodationAvailability(params) {
  const {
    accommodation,
    reservations,
    stayType,
    checkInDate,
    checkOutDate,
    session,
    guestCount,
    excludeReservationId
  } = params;
  if (!accommodation.isAvailable || accommodation.status === "Maintenance") {
    return {
      available: false,
      reason: `${accommodation.name} is currently unavailable for booking.`
    };
  }
  if (guestCount && guestCount > accommodation.capacity) {
    return {
      available: false,
      reason: `Guest count (${guestCount}) exceeds maximum capacity of ${accommodation.capacity} guests.`
    };
  }
  if (stayType === "day_use" && accommodation.bookingMode === "overnight") {
    return {
      available: false,
      reason: `${accommodation.name} is available for overnight stays only.`
    };
  }
  if (stayType === "overnight" && accommodation.bookingMode === "day_use") {
    return {
      available: false,
      reason: `${accommodation.name} is available for day-use sessions only.`
    };
  }
  const activeForUnit = reservations.filter(
    (r) => r.accommodationId === accommodation.id && r.id !== excludeReservationId && ACTIVE_RESERVATION_STATUSES.has(r.status)
  );
  if (stayType === "day_use") {
    const sessions = ["Morning", "Afternoon", "Night"];
    const unavailableSessions = [];
    for (const s of sessions) {
      const hasSessionConflict = activeForUnit.some(
        (r) => r.stayType === "day_use" && r.checkInDate === checkInDate && r.session === s || r.stayType === "overnight" && checkInDate >= r.checkInDate && checkInDate < r.checkOutDate
      );
      if (hasSessionConflict) unavailableSessions.push(s);
    }
    if (session && unavailableSessions.includes(session)) {
      const conflict = activeForUnit.find(
        (r) => r.stayType === "day_use" && r.checkInDate === checkInDate && r.session === session || r.stayType === "overnight" && checkInDate >= r.checkInDate && checkInDate < r.checkOutDate
      );
      return {
        available: false,
        reason: `${accommodation.name} is already reserved for the ${session} session on ${checkInDate}.`,
        conflictingReservationRef: conflict?.referenceNumber,
        unavailableSessions
      };
    }
    return { available: true, unavailableSessions };
  }
  const effectiveCheckOut = checkOutDate || checkInDate;
  if (effectiveCheckOut <= checkInDate) {
    return {
      available: false,
      reason: "Check-out date must be after check-in date for overnight stays."
    };
  }
  for (const r of activeForUnit) {
    if (r.stayType === "overnight") {
      if (datesOverlap(checkInDate, effectiveCheckOut, r.checkInDate, r.checkOutDate)) {
        return {
          available: false,
          reason: `${accommodation.name} has an overlapping reservation (${r.referenceNumber}) from ${r.checkInDate} to ${r.checkOutDate}.`,
          conflictingReservationRef: r.referenceNumber
        };
      }
    } else if (r.stayType === "day_use") {
      if (r.checkInDate >= checkInDate && r.checkInDate < effectiveCheckOut) {
        return {
          available: false,
          reason: `${accommodation.name} has a day-use booking (${r.referenceNumber}) on ${r.checkInDate}.`,
          conflictingReservationRef: r.referenceNumber
        };
      }
    }
  }
  return { available: true };
}
export {
  calculateReservationPricing,
  checkAccommodationAvailability
};
