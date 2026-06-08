const approvedUserFilter = {
  $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
};

const isLegacyApprovedUser = (rawUser) =>
  rawUser && rawUser.approvalStatus === undefined;

module.exports = {
  approvedUserFilter,
  isLegacyApprovedUser,
};
