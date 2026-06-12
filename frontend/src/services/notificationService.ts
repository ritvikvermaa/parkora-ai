import API from "./api";
import { getAuthHeaders } from "./authHeaders";

export type AppNotification = {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "destructive";
  category: "registration" | "visitor" | "parking" | "vehicle" | "settings" | "system";
  link?: string;
  isRead?: boolean;
  createdAt: string;
};

export const getNotifications = async (limit = 30) => {
  const res = await fetch(`${API}/api/notifications?limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const markNotificationRead = async (id: string) => {
  const res = await fetch(`${API}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return await res.json();
};

export const markAllNotificationsRead = async () => {
  const res = await fetch(`${API}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return await res.json();
};
