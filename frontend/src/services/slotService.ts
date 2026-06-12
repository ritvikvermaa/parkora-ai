import API from "./api";
import { getAuthHeaders } from "./authHeaders";

export const getAvailableSlots = async () => {
  const res = await fetch(`${API}/api/slots/guard-available`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.slots || [];
};

export const getSlots = async () => {
  const res = await fetch(`${API}/api/slots`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.slots || [];
};

export const addSlot = async (data: any) => {
  const res = await fetch(`${API}/api/slots/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};

export const deleteSlot = async (id: string) => {
  const res = await fetch(`${API}/api/slots/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return await res.json();
};
