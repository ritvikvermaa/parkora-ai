import API from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getPendingVisitors = async () => {
  const res = await fetch(`${API}/api/visitors/pending`, {
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const approveVisitor = async (id: string) => {
  const res = await fetch(`${API}/api/visitors/approve/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const rejectVisitor = async (id: string) => {
  const res = await fetch(`${API}/api/visitors/reject/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const exitVisitor = async (id: string) => {
  const res = await fetch(`${API}/api/visitors/exit/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const visitorExit = exitVisitor;

export const getVisitors = async () => {
  const res = await fetch(`${API}/api/visitors`, {
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const createVisitor = async (data: any) => {
  const res = await fetch(`${API}/api/visitors/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return await res.json();
};