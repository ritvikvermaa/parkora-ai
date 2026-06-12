import { createFileRoute } from "@tanstack/react-router";

import ProtectedRoute from "../components/ProtectedRoute";
import { ResidentDashboard, type ResidentView } from "./_app.dashboard";

const validSections: ResidentView[] = [
  "vehicles",
  "visitors",
  "requests",
  "history",
  "slots",
];

export const Route = createFileRoute("/_app/dashboard_/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${formatTitle(params.section)} — Parkora AI` }],
  }),
  component: ResidentSectionRoute,
});

function ResidentSectionRoute() {
  const { section } = Route.useParams();
  const view = validSections.includes(section as ResidentView)
    ? (section as ResidentView)
    : "vehicles";

  return (
    <ProtectedRoute roles={["admin", "resident"]}>
      <ResidentDashboard view={view} />
    </ProtectedRoute>
  );
}

function formatTitle(section = "") {
  return section.charAt(0).toUpperCase() + section.slice(1);
}
