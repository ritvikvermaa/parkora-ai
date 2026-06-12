const Notification = require("../models/notification");
const { flatAliases } = require("./society");

const unique = (items = []) =>
  Array.from(new Set(items.filter(Boolean).map((item) => item.toString())));

const normalizeFlats = (flats = []) =>
  unique(flats.flatMap((flat) => flatAliases(flat)));

const createNotification = async ({
  title,
  message,
  type = "info",
  category = "system",
  targetRoles = [],
  targetUsers = [],
  targetFlats = [],
  link = "",
  metadata = {},
}) => {
  if (!title || !message) return null;

  const roles = unique(targetRoles);
  const users = unique(targetUsers);
  const flats = normalizeFlats(targetFlats);

  if (!roles.length && !users.length && !flats.length) return null;

  return Notification.create({
    title,
    message,
    type,
    category,
    targetRoles: roles,
    targetUsers: users,
    targetFlats: flats,
    link,
    metadata,
  });
};

module.exports = {
  createNotification,
};
