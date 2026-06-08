import API from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminStats = async () => {
  const res = await fetch(`${API}/api/admin/stats`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.stats;
};

export const getRecentActivity = async () => {
  const res = await fetch(
    `${API}/api/admin/recent-activity`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await res.json();

  return data.activity || [];
};

export const getResidents = async () => {
  const res = await fetch(`${API}/api/admin/residents`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.residents || [];
};

export const getPendingUsers = async () => {
  const res = await fetch(`${API}/api/admin/pending-users`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.users || [];
};

export const updateUserApproval = async (
  id: string,
  approvalStatus: "approved" | "rejected"
) => {
  const res = await fetch(`${API}/api/admin/users/${id}/approval`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ approvalStatus }),
  });

  return await res.json();
};
