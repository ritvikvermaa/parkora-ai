import API from "./api";
import { getAuthHeaders } from "./authHeaders";

export const getActiveVehicles = async () => {
  const res = await fetch(`${API}/api/vehicles/active`, {
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const vehicleEntry = async (data: any) => {
  const res = await fetch(`${API}/api/vehicles/entry`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};

export const vehicleExit = async (vehicleNumber: string) => {
  const res = await fetch(`${API}/api/vehicles/exit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      vehicleNumber,
    }),
  });

  return await res.json();
};

export const addResidentVehicle = async (data: any) => {
  const res = await fetch(`${API}/api/vehicles/resident/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};

export const removeResidentVehicle = async (id: string) => {
  const res = await fetch(`${API}/api/vehicles/resident/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return await res.json();
};
