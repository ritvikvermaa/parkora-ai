const hourWeight = (hour) => {
  if (hour >= 18 && hour <= 22) return 1.25;
  if (hour >= 8 && hour <= 11) return 1.1;
  if (hour >= 0 && hour <= 5) return 0.65;
  return 0.9;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildParkingPressure = ({ slots, vehicles, visitors, now = new Date() }) => {
  const activeSlots = slots.filter((slot) => slot.isActive !== false);
  const visitorSlots = activeSlots.filter((slot) => slot.type === "visitor");
  const occupiedSlots = activeSlots.filter((slot) => slot.status === "occupied");
  const activeVehicles = vehicles.filter((vehicle) => vehicle.isParked);
  const activeVisitors = visitors.filter((visitor) => visitor.status === "approved");
  const pendingVisitors = visitors.filter((visitor) => visitor.status === "pending");
  const unavailableVisitors = visitors.filter(
    (visitor) => visitor.status === "parking_unavailable"
  );

  const occupancyRatio = activeSlots.length
    ? occupiedSlots.length / activeSlots.length
    : 0;
  const visitorOccupancyRatio = visitorSlots.length
    ? visitorSlots.filter((slot) => slot.status === "occupied").length / visitorSlots.length
    : 0;

  const last24h = visitors.filter((visitor) => {
    const createdAt = visitor.createdAt ? new Date(visitor.createdAt).getTime() : 0;
    return now.getTime() - createdAt <= 24 * 60 * 60 * 1000;
  });

  const requestVelocity = last24h.length / 24;
  const overstayRisk = activeVisitors.filter((visitor) => {
    const entryAt = visitor.entryTime ? new Date(visitor.entryTime).getTime() : 0;
    return entryAt && now.getTime() - entryAt > 4 * 60 * 60 * 1000;
  }).length;

  const pressureScore = Math.round(
    clamp(
      (occupancyRatio * 45 +
        visitorOccupancyRatio * 25 +
        requestVelocity * 8 +
        pendingVisitors.length * 4 +
        unavailableVisitors.length * 6 +
        overstayRisk * 5) *
        hourWeight(now.getHours()),
      0,
      100
    )
  );

  const level =
    pressureScore >= 75 ? "high" : pressureScore >= 45 ? "moderate" : "healthy";

  const actions = [];

  if (visitorOccupancyRatio >= 0.8) {
    actions.push("Keep resident fallback enabled until visitor demand drops.");
  }

  if (pendingVisitors.length > 0) {
    actions.push("Ask residents to approve pending requests before the gate queue builds up.");
  }

  if (overstayRisk > 0) {
    actions.push("Review long-stay visitor vehicles before peak hours.");
  }

  if (unavailableVisitors.length > 0) {
    actions.push("Open temporary visitor capacity or ask guards to hold new entries.");
  }

  if (actions.length === 0) {
    actions.push("Capacity is stable. Keep current allocation rules active.");
  }

  return {
    pressureScore,
    level,
    occupancyRatio,
    visitorOccupancyRatio,
    requestVelocity,
    overstayRisk,
    pendingVisitors: pendingVisitors.length,
    unavailableVisitors: unavailableVisitors.length,
    actions,
  };
};

module.exports = {
  buildParkingPressure,
};
