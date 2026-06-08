import API from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getSettings = async () => {
  const res = await fetch(`${API}/api/settings`, {
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const updateProfile = async (data: any) => {
  const res = await fetch(`${API}/api/settings/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};

export const updateSocietySettings = async (data: any) => {
  const res = await fetch(`${API}/api/settings/society`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};
