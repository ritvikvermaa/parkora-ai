import API from "./api";
import { getAuthHeaders } from "./authHeaders";

export const getResidentDashboard = async () => {
  const res = await fetch(`${API}/api/resident/dashboard`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.data;
};

export const inviteVisitor = async (data: any) => {
  const res = await fetch(`${API}/api/resident/invite-visitor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const payload = await res.json();

  return {
    ...payload,
    statusCode: res.status,
  };
};

export const addResidentVehicle = async (data: any) => {
  const res = await fetch(`${API}/api/vehicles/resident/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};
