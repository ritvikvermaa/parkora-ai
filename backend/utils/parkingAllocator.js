const ParkingSlot = require("../models/parkingSlot");
const User = require("../models/user");
const Setting = require("../models/setting");
const { approvedUserFilter } = require("./userStatus");
const {
  BLOCKS,
  blockMap,
  flatAliases,
  getFlatParts,
  normalizeFlat,
} = require("./society");

const normalizeVehicleNumber = (vehicleNumber = "") =>
  vehicleNumber.toString().trim().toUpperCase();

const isFlatHandedOver = async (flat) => {
  const resident = await User.findOne({
    role: "resident",
    ...approvedUserFilter,
    flat: { $in: flatAliases(flat) },
  });

  return Boolean(resident);
};

const isVisitorFallbackEnabled = async () => {
  const setting = await Setting.findOne({ key: "society" }).lean();
  return setting?.value?.visitorFallbackEnabled !== false;
};

const findVisitorSlot = () =>
  ParkingSlot.findOne({
    isActive: true,
    type: "visitor",
    status: "available",
    isReservedForFlat: false,
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

const findUnhandoverResidentFallbackSlot = async (flat = "") => {
  if (!(await isVisitorFallbackEnabled())) return null;

  const { tower } = getFlatParts(flat);

  const slots = await ParkingSlot.find({
    isActive: true,
    type: "resident",
    status: "available",
    isReservedForFlat: false,
    allowVisitorFallback: true,
  }).sort({
    tower: tower ? -1 : 1,
    blockCode: 1,
    slotNumber: 1,
  });

  for (const slot of slots) {
    if (!(await isFlatHandedOver(slot.flat || slot.reservedForFlat))) {
      return slot;
    }
  }

  return null;
};

const findVisitorOrUnhandoverResidentSlot = async (flat = "") => {
  const visitorSlot = await findVisitorSlot();
  if (visitorSlot) return visitorSlot;

  return findUnhandoverResidentFallbackSlot(flat);
};

const findPrimaryResidentSlot = async (flat) => {
  const { flatWithoutBlock, blockCode } = getFlatParts(flat);
  const aliases = flatAliases(flat);

  return ParkingSlot.findOne({
    isActive: true,
    type: "resident",
    status: { $in: ["available", "reserved"] },
    $or: [
      { reservedForFlat: { $in: aliases } },
      { flat: { $in: aliases } },
      { blockCode, flat: flatWithoutBlock },
    ],
  }).sort({ isReservedForFlat: -1, blockCode: 1, tower: 1, slotNumber: 1 });
};

const findResidentVehicleSlot = async (flat) => {
  const residentSlot = await findPrimaryResidentSlot(flat);
  if (residentSlot) return residentSlot;

  return findVisitorOrUnhandoverResidentSlot(flat);
};

module.exports = {
  BLOCKS,
  blockMap,
  flatAliases,
  normalizeFlat,
  normalizeVehicleNumber,
  findResidentVehicleSlot,
  findVisitorOrUnhandoverResidentSlot,
};
