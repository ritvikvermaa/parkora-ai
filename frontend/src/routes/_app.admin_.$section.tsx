import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { AdminDashboard, type AdminView } from "./_app.admin";

const validSections: AdminView[] = [
  "operations",
  "analytics",
  "approvals",
  "residents",
  "activity",
];

export const Route = createFileRoute("/_app/admin_/$section")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${formatTitle(params.section)} — Parkora AI`,
      },
    ],
  }),
  component: AdminSectionRoute,
});

function AdminSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as AdminView)
    ? (section as AdminView)
    : "operations";

  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboard view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
